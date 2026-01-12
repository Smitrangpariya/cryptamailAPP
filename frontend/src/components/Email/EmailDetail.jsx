import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { decryptEmailMessage } from "../../services/emailService";
import { emailAPI } from "../../services/apiService";
import AttachmentItem from "./AttachmentItem";

export default function EmailDetail({
  email,
  userPrivateKey,
  onClose,
  viewType,
  onEdit,
  onDelete
}) {
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    
    const decryptContent = async () => {
      if (!email || cancelled) return;

      if (!userPrivateKey) {
        if (!cancelled) {
          console.error("🔐 Private key not available for email decryption");
          setError(
            "Private key not available. Please unlock your mailbox again."
          );
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError("");
      }

      console.log("🔓 Starting email content decryption:", {
        emailId: email.id,
        fromUsername: email.fromUsername,
        viewType,
        hasEncryptedSubject: !!email.encryptedSubject,
        hasEncryptedBody: !!email.encryptedBody,
        privateKeyType: userPrivateKey?.type,
        privateKeyAlgorithm: userPrivateKey?.algorithm?.name
      });

      try {
        const decrypted = await decryptEmailMessage(
          email,
          userPrivateKey,
          viewType
        );
        
        console.log("✅ Email content decrypted successfully:", {
          emailId: email.id,
          subjectLength: decrypted.subject?.length,
          bodyLength: decrypted.body?.length,
          attachmentCount: decrypted.attachments?.length
        });

        if (!cancelled) {
          setDecryptedContent(decrypted);
        }

        if (viewType === "inbox" && !email.isRead && !cancelled) {
          await emailAPI.markAsRead(email.id);
        }
      } catch (err) {
        console.error("❌ Email decryption failed:", {
          emailId: email.id,
          errorMessage: err.message,
          errorName: err.name,
          errorStack: err.stack?.substring(0, 200)
        });

        if (!cancelled) {
          setError("Failed to decrypt email content: " + err.message);
          setLoading(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    decryptContent();

    return () => {
      cancelled = true;
    };
  }, [email, userPrivateKey, viewType]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (username) => `${username}@smail.in`;

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <button
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            title="Back to list"
          >
            <span className="text-lg">←</span> Back
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
          <motion.div
            className="text-4xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🔐
          </motion.div>
          <div className="font-medium text-lg">Decrypting email...</div>
          <div className="w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-indigo-600"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="flex flex-col h-full bg-white dark:bg-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <button
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            title="Back to list"
          >
            <span className="text-lg">←</span> Back
          </button>
        </div>
        <motion.div 
          className="p-8 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl max-w-md w-full border border-red-100 dark:border-red-800/30"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="text-3xl mb-4"
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              ❌
            </motion.div>
            <strong className="block text-red-600 dark:text-red-400 text-lg mb-2">Unable to view message</strong>
            <p className="text-slate-600 dark:text-slate-300">{error}</p>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (!decryptedContent) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <button
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            title="Back to list"
          >
            <span className="text-lg">←</span> Back
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <div className="text-2xl mb-2">📧</div>
            <div>Loading email content...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
        <button
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 pr-4 border-r border-slate-200 dark:border-slate-700"
          onClick={onClose}
          title="Back to list"
        >
          <span className="text-lg">←</span> Back
        </button>
        
        <div className="flex-1">
          <motion.h2 
            className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {decryptedContent.subject || "(No Subject)"}
          </motion.h2>
          <motion.div 
            className="text-sm text-slate-500 dark:text-slate-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            From: {formatAddress(email.fromUsername)} • {formatDate(email.timestamp)}
          </motion.div>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            onClick={() => onEdit({
              to: viewType === "sent" ? email.toUsername : email.fromUsername,
              subject: `Re: ${decryptedContent.subject}`,
              body: `\n\n---\nOn ${formatDate(email.timestamp)}, ${email.fromUsername} wrote:\n${decryptedContent.body}`,
              replyToEmailId: email.id
            })}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Reply"
          >
            ↩️
          </motion.button>
          
          <motion.button
            onClick={() => onEdit({
              to: '',
              subject: `Fwd: ${decryptedContent.subject}`,
              body: `\n\n--- Forwarded message ---\nFrom: ${email.fromUsername}\nDate: ${formatDate(email.timestamp)}\nSubject: ${decryptedContent.subject}\n\n${decryptedContent.body}`,
              forwardEmailId: email.id
            })}
            className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Forward"
          >
            ↪️
          </motion.button>
          
          <motion.button
            onClick={() => onDelete(email.id)}
            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Delete"
          >
            🗑️
          </motion.button>
        </div>
      </div>

      <motion.div 
        className="flex-1 overflow-y-auto p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div 
          className="prose dark:prose-invert max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {decryptedContent.body.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 whitespace-pre-wrap">
              {paragraph || '\u00A0'}
            </p>
          ))}
        </motion.div>
        
        {decryptedContent.attachments && decryptedContent.attachments.length > 0 && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
              📎 Attachments ({decryptedContent.attachments.length})
            </h3>
            <div className="space-y-2">
              {decryptedContent.attachments.map((attachment, index) => (
                <motion.div
                  key={attachment.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <AttachmentItem
                    key={attachment.id || attachment}
                    attachment={attachment}
                    userPrivateKey={userPrivateKey}
                    isSender={viewType === 'sent' || viewType === 'drafts' || email.isSender}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}