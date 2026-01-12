import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { emailAPI, userAPI } from "../../services/apiService";
import { sendEncryptedEmail } from "../../services/emailService";
import { useAuth } from "../../context/AuthContext";
import { importPublicKey, arrayBufferToBase64, generateAESKey, encryptChunk, encryptAESKeyWithRSA, decryptAESKeyWithRSA, CHUNK_SIZE } from "../../utils/cryptoUtils";
import CryptaMailLoader from "../ui/CryptaMailLoader";

export default function ComposeModal({ onClose, onEmailSent, initialData = null }) {
  const { user, privateKey: userPrivateKey } = useAuth();
  const myPublicKey = user?.publicKey;
  const [to, setTo] = useState(initialData?.to ? (initialData.to.includes('@') ? initialData.to : initialData.to + '@smail.in') : "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachment = async (file) => {
    try {
      // Step 1: Get recipient's public key
      const toEmail = to.includes('@') ? to : `${to}@smail.in`;
      const recipientResponse = await userAPI.getPublicKey(toEmail);
      const recipientPublicKey = await importPublicKey(recipientResponse.data.publicKey);
      const recipientPublicKeyB64 = recipientResponse.data.publicKey;

      // Step 2: Generate AES key for file encryption
      const aesKey = await generateAESKey();

      // Self-test passed and removed.

      // Step 3: Read file and encrypt in chunks
      const fileContent = await file.arrayBuffer();
      const chunkSize = Math.min(CHUNK_SIZE, 5 * 1024 * 1024); // 5MB per chunk
      const totalChunks = Math.ceil(fileContent.byteLength / chunkSize);

      // Step 4: Encrypt filename
      const filenameIv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedFilenameBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: filenameIv },
        aesKey,
        new TextEncoder().encode(file.name)
      );
      const encryptedFilenameB64 = arrayBufferToBase64(encryptedFilenameBuffer);
      // Convert IV to base64 - create a proper ArrayBuffer slice to avoid buffer size issues
      const filenameIvArrayBuffer = filenameIv.buffer.slice(filenameIv.byteOffset, filenameIv.byteOffset + filenameIv.byteLength);
      const filenameIvB64 = arrayBufferToBase64(filenameIvArrayBuffer);

      // Step 5: Encrypt AES key for both sender and recipient
      const senderPublicKeyObj = await importPublicKey(user.publicKey);
      const encryptedKeyRecipient = await encryptAESKeyWithRSA(aesKey, recipientPublicKey);
      const encryptedKeySender = await encryptAESKeyWithRSA(aesKey, senderPublicKeyObj);

      // Step 6: Initialize upload
      const initResponse = await emailAPI.initAttachment({
        encryptedFilename: encryptedFilenameB64,
        filenameIv: filenameIvB64,
        encryptedKeySender: encryptedKeySender,
        encryptedKeyRecipient: encryptedKeyRecipient,
        mimeType: file.type,
        totalSize: fileContent.byteLength,
        totalChunks: totalChunks
      });

      const attachmentId = initResponse.data.id;

      // Step 7: Upload encrypted chunks

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileContent.byteLength);
        const chunkBuffer = new Uint8Array(fileContent.slice(start, end));

        // Encrypt this chunk
        const encryptedChunk = await encryptChunk(chunkBuffer, aesKey);
        // encryptChunk returns { encryptedData: ArrayBuffer, iv: Uint8Array }

        const encryptedDataB64 = arrayBufferToBase64(encryptedChunk.encryptedData);
        // Convert Uint8Array IV to base64 - create a proper ArrayBuffer slice to avoid buffer size issues
        const ivArrayBuffer = encryptedChunk.iv.buffer.slice(encryptedChunk.iv.byteOffset, encryptedChunk.iv.byteOffset + encryptedChunk.iv.byteLength);
        const ivB64 = arrayBufferToBase64(ivArrayBuffer);

        try {
          await emailAPI.uploadChunk(attachmentId, {
            chunkIndex: i,
            encryptedData: encryptedDataB64,
            iv: ivB64,
            size: chunkBuffer.length
          });
          console.log(`✅ Chunk ${i} uploaded successfully`);
        } catch (chunkError) {
          console.error(`❌ Chunk ${i} upload failed:`, chunkError);
          throw new Error(`Chunk ${i} upload failed: ${chunkError.message}`);
        }
      }

      // Step 8: Complete upload
      await emailAPI.completeAttachment(attachmentId);
      return attachmentId;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to upload attachment:', error);
      }
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  };

  const send = async (saveAsDraft = false) => {
    if (!to || (!subject && !body)) {
      alert("Please fill in recipient and at least subject or body");
      return;
    }

    setLoading(true);
    try {
      if (!user?.publicKey) {
        throw new Error("Your public key is missing. Please re-login.");
      }

      // Upload attachments first
      const attachmentIds = [];
      for (const file of files) {
        const attachmentId = await uploadAttachment(file);
        attachmentIds.push(attachmentId);
      }

      // Send email - sendEncryptedEmail handles encryption internally
      // Pass plaintext subject and body - they will be encrypted by the service
      await sendEncryptedEmail({
        toAddress: to,
        subject: subject || "(No Subject)",
        body: body || "",
        senderPublicKeyB64: user.publicKey,
        attachmentIds: attachmentIds,
      });

      onEmailSent();
      onClose(); // Auto close on success
    } catch (error) {
      console.error("Failed to send email:", error);
      alert(`Failed to send email: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-lg shadow-2xl relative"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <motion.h2
              className="text-xl font-bold dark:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              Compose Email
            </motion.h2>

            <motion.button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          </div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="recipient@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Email subject"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         h-32 resize-none"
                placeholder="Your message..."
                disabled={loading}
              />
            </div>

            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Attachments:
                </div>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span className="text-sm truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex gap-2">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                📎 Attach
              </label>
            </div>
          </motion.div>

          <motion.div
            className="flex gap-2 mt-6 justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={() => send(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.05, boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)" }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
            >
              {loading ? (
                <>
                  <CryptaMailLoader size={16} />
                  <span>Sending...</span>
                </>
              ) : "Send"}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}