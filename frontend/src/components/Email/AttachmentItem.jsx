import { useState, useEffect } from "react";
import { emailAPI } from "../../services/apiService";
import {
    decryptFilename,
    decryptAESKeyWithRSA,
    decryptChunk,
    base64ToArrayBuffer
} from "../../utils/cryptoUtils";

/**
 * AttachmentItem Component
 * 
 * Handles:
 * - Secure filename decryption using AES-GCM
 * - Chunked file download with decryption
 * - Support for both sender and recipient access
 * 
 * Key Selection Logic:
 * - Sender files use encryptedKeySender
 * - Recipient files use encryptedKeyRecipient
 * - Falls back to the other key if primary fails
 */
export default function AttachmentItem({ attachment: initialAttachment, userPrivateKey, isSender }) {
    const [attachment, setAttachment] = useState(initialAttachment);
    const [filename, setFilename] = useState("Decrypting name...");
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [metadataLoading, setMetadataLoading] = useState(
        typeof initialAttachment === 'number' || !initialAttachment?.encryptedFilename
    );

    // Load attachment metadata if only ID was provided
    useEffect(() => {
        const loadMetadata = async () => {
            if (typeof attachment === 'number' || !attachment?.encryptedFilename) {
                try {
                    const id = typeof attachment === 'number' ? attachment : attachment?.id;
                    if (!id) {
                        console.error("❌ No attachment ID provided");
                        setFilename("Invalid attachment");
                        setMetadataLoading(false);
                        return;
                    }

                    console.log("📥 Loading attachment metadata for ID:", id);
                    const res = await emailAPI.getAttachmentMetadata(id);

                    console.log("✅ Attachment metadata loaded:", {
                        id: res.data?.id,
                        hasEncryptedFilename: !!res.data?.encryptedFilename,
                        hasFilenameIv: !!res.data?.filenameIv,
                        hasEncryptedKeySender: !!res.data?.encryptedKeySender,
                        hasEncryptedKeyRecipient: !!res.data?.encryptedKeyRecipient,
                        totalChunks: res.data?.totalChunks
                    });

                    setAttachment(res.data);
                    setMetadataLoading(false);
                } catch (e) {
                    console.error("❌ Failed to load attachment metadata:", {
                        error: e.message,
                        status: e.response?.status,
                        data: e.response?.data
                    });
                    setFilename("Unavailable");
                    setError("Failed to load attachment");
                    setMetadataLoading(false);
                }
            }
        };
        loadMetadata();
    }, [attachment]);

    // Decrypt filename for display
    useEffect(() => {
        const decryptName = async () => {
            if (metadataLoading || !attachment || !attachment.encryptedFilename) {
                return;
            }

            // Check if we have the required data for decryption
            if (!attachment.filenameIv || attachment.filenameIv.trim() === '') {
                console.warn("⚠️ No filename IV - showing encrypted filename as fallback");
                setFilename(attachment.encryptedFilename.substring(0, 30) + "...");
                return;
            }

            // Select the appropriate encrypted key based on user role
            const encryptedKey = selectEncryptedKey(attachment, isSender);

            if (!encryptedKey) {
                console.error("❌ No valid encrypted key available for filename decryption");
                setFilename(attachment.encryptedFilename.substring(0, 20) + "...");
                return;
            }

            if (!userPrivateKey) {
                console.error("❌ User private key not available for filename decryption");
                setFilename("🔒 Locked");
                return;
            }

            try {
                console.log("🔓 Decrypting filename...", {
                    encryptedFilenameLength: attachment.encryptedFilename?.length,
                    filenameIvLength: attachment.filenameIv?.length,
                    encryptedKeyLength: encryptedKey?.length,
                    isSender,
                    privateKeyType: userPrivateKey?.type
                });

                const name = await decryptFilename(
                    attachment.encryptedFilename,
                    attachment.filenameIv,
                    encryptedKey,
                    userPrivateKey
                );

                console.log("✅ Filename decrypted:", name);
                setFilename(name);
                setError(null);
            } catch (e) {
                console.error("❌ Filename decryption failed:", e.message);

                // Try with alternate key
                const alternateKey = isSender
                    ? attachment.encryptedKeyRecipient
                    : attachment.encryptedKeySender;

                if (alternateKey && alternateKey !== encryptedKey) {
                    try {
                        console.log("🔄 Trying alternate key for filename...");
                        const name = await decryptFilename(
                            attachment.encryptedFilename,
                            attachment.filenameIv,
                            alternateKey,
                            userPrivateKey
                        );
                        console.log("✅ Filename decrypted with alternate key:", name);
                        setFilename(name);
                        setError(null);
                        return;
                    } catch (altError) {
                        console.error("❌ Alternate key also failed:", altError.message);
                    }
                }

                // Fallback to truncated encrypted filename
                setFilename(attachment.encryptedFilename.substring(0, 20) + "...");
            }
        };

        decryptName();
    }, [attachment, userPrivateKey, isSender, metadataLoading]);

    /**
     * Select the appropriate encrypted key based on user role
     */
    function selectEncryptedKey(att, userIsSender) {
        // Primary key based on role
        let primaryKey = userIsSender ? att.encryptedKeySender : att.encryptedKeyRecipient;

        // If primary is missing, try the other
        if (!primaryKey || primaryKey.trim() === '') {
            primaryKey = userIsSender ? att.encryptedKeyRecipient : att.encryptedKeySender;
        }

        // Last resort - any available key
        if (!primaryKey || primaryKey.trim() === '') {
            primaryKey = att.encryptedKeySender || att.encryptedKeyRecipient;
        }

        return primaryKey && primaryKey.trim() !== '' ? primaryKey : null;
    }

    /**
     * Decrypt the AES key, trying primary and alternate keys
     */
    async function decryptAESKey(att, userIsSender, privateKey) {
        const primaryKey = userIsSender ? att.encryptedKeySender : att.encryptedKeyRecipient;
        const alternateKey = userIsSender ? att.encryptedKeyRecipient : att.encryptedKeySender;

        console.log("🔐 Attempting to decrypt AES key:", {
            isSender: userIsSender,
            hasPrimaryKey: !!primaryKey,
            hasAlternateKey: !!alternateKey,
            primaryKeyLength: primaryKey?.length,
            alternateKeyLength: alternateKey?.length,
            privateKeyAlgorithm: privateKey?.algorithm?.name
        });

        // Try primary key first
        if (primaryKey && primaryKey.trim() !== '') {
            try {
                const aesKey = await decryptAESKeyWithRSA(primaryKey, privateKey);

                // DEBUG: Log AES key fingerprint for comparison with encryption
                const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey);
                const keyBytes = new Uint8Array(exportedKey);
                const keyFingerprint = Array.from(keyBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
                console.log("🔑 DOWNLOAD: AES key fingerprint (first 8 bytes):", keyFingerprint);
                console.log("🔑 DOWNLOAD: Used encryptedKey length:", primaryKey.length);

                console.log("✅ AES key decrypted with primary key");
                return aesKey;
            } catch (primaryError) {
                console.warn("⚠️ Primary key failed:", primaryError.message);

                // Try alternate key
                if (alternateKey && alternateKey.trim() !== '' && alternateKey !== primaryKey) {
                    try {
                        console.log("🔄 Trying alternate key...");
                        const aesKey = await decryptAESKeyWithRSA(alternateKey, privateKey);
                        console.log("✅ AES key decrypted with alternate key");
                        return aesKey;
                    } catch (alternateError) {
                        console.error("❌ Both keys failed:", {
                            primaryError: primaryError.message,
                            alternateError: alternateError.message
                        });
                        throw new Error("Cannot decrypt file: key mismatch");
                    }
                }
                throw primaryError;
            }
        }

        // Try alternate key if no primary
        if (alternateKey && alternateKey.trim() !== '') {
            const aesKey = await decryptAESKeyWithRSA(alternateKey, privateKey);
            console.log("✅ AES key decrypted with alternate key (no primary)");
            return aesKey;
        }

        throw new Error("No valid encryption key available");
    }

    /**
     * Download and decrypt the attachment
     */
    const handleDownload = async () => {
        setDownloading(true);
        setProgress(0);
        setError(null);

        try {
            // Validate prerequisites
            if (!attachment || typeof attachment !== 'object') {
                throw new Error("Invalid attachment data");
            }

            if (!userPrivateKey) {
                throw new Error("Private key not available. Please unlock your mailbox.");
            }

            // Step 1: Decrypt the AES key
            const aesKey = await decryptAESKey(attachment, isSender, userPrivateKey);

            // Step 2: Download and decrypt chunks
            const chunks = [];
            const totalChunks = attachment.totalChunks || 0;

            if (totalChunks === 0) {
                // Empty file
                console.log("📄 Empty file (0 chunks)");
            } else {
                for (let i = 0; i < totalChunks; i++) {
                    try {
                        console.log(`📦 Downloading chunk ${i + 1}/${totalChunks}...`);

                        const res = await emailAPI.getAttachmentChunk(attachment.id, i);
                        const { encryptedData: encDataB64, iv: ivB64 } = res.data;

                        // Validate chunk data
                        if (!encDataB64 || typeof encDataB64 !== 'string' || encDataB64.trim() === '') {
                            throw new Error(`Chunk ${i}: No encrypted data received`);
                        }
                        if (!ivB64 || typeof ivB64 !== 'string' || ivB64.trim() === '') {
                            throw new Error(`Chunk ${i}: No IV received`);
                        }

                        // Decode base64 to ArrayBuffer
                        const encryptedBuffer = base64ToArrayBuffer(encDataB64.trim());
                        const ivBuffer = base64ToArrayBuffer(ivB64.trim());
                        const ivUint8 = new Uint8Array(ivBuffer);

                        // Validate IV length (should be 12 bytes for AES-GCM)
                        if (ivUint8.length < 12) {
                            throw new Error(`Chunk ${i}: Invalid IV length ${ivUint8.length} (expected 12)`);
                        }

                        // Decrypt the chunk
                        const decryptedBuffer = await decryptChunk(encryptedBuffer, aesKey, ivUint8);
                        chunks.push(new Uint8Array(decryptedBuffer));

                        console.log(`✅ Chunk ${i} decrypted:`, {
                            decryptedSize: decryptedBuffer.byteLength
                        });

                        // Update progress
                        setProgress(Math.round(((i + 1) / totalChunks) * 100));

                    } catch (chunkError) {
                        console.error(`❌ Chunk ${i} failed:`, chunkError);
                        throw new Error(`Failed to decrypt chunk ${i}: ${chunkError.message}`);
                    }
                }
            }

            // Step 3: Create and download blob
            const blob = new Blob(chunks, {
                type: attachment.mimeType || "application/octet-stream"
            });

            console.log("📄 File assembled:", {
                blobSize: blob.size,
                type: blob.type,
                filename
            });

            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename !== "Decrypting name..." ? filename : `attachment_${attachment.id}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Cleanup
            setTimeout(() => window.URL.revokeObjectURL(url), 100);

            console.log("✅ Download complete!");

        } catch (error) {
            console.error("❌ Download failed:", error);
            setError(error.message);
            alert("Failed to download: " + error.message);
        } finally {
            setDownloading(false);
            setProgress(0);
        }
    };

    // Format file size for display
    const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Get file icon based on MIME type
    const getFileIcon = () => {
        const mimeType = attachment?.mimeType || "";
        if (mimeType.includes("image")) return "🖼️";
        if (mimeType.includes("video")) return "🎬";
        if (mimeType.includes("audio")) return "🎵";
        if (mimeType.includes("pdf")) return "📕";
        if (mimeType.includes("zip") || mimeType.includes("compressed")) return "📦";
        if (mimeType.includes("text")) return "📝";
        return "📄";
    };

    return (
        <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors
            ${error
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
        >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                <span className="text-2xl flex-shrink-0">
                    {getFileIcon()}
                </span>
                <div className="flex flex-col min-w-0">
                    <span
                        className={`text-sm font-medium truncate ${error ? 'text-red-700 dark:text-red-300' : 'dark:text-slate-200'
                            }`}
                        title={filename}
                    >
                        {filename}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {attachment?.totalSize
                            ? formatSize(attachment.totalSize)
                            : attachment?.size
                                ? formatSize(attachment.size)
                                : "..."
                        }
                        {downloading && ` • ${progress}%`}
                    </span>
                    {error && (
                        <span className="text-xs text-red-600 dark:text-red-400 truncate">
                            {error}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={handleDownload}
                disabled={downloading || metadataLoading || typeof attachment !== 'object'}
                className={`ml-2 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                    ${downloading
                        ? 'bg-indigo-100 dark:bg-slate-600 text-indigo-600 dark:text-indigo-300'
                        : error
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200'
                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-700 dark:text-indigo-400 dark:hover:bg-slate-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={downloading ? `Downloading... ${progress}%` : "Download attachment"}
            >
                {downloading ? (
                    <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {progress}%
                    </span>
                ) : error ? (
                    "↻"
                ) : (
                    "⬇"
                )}
            </button>
        </div>
    );
}
