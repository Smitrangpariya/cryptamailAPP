/**
 * Email Service for End-to-End Encrypted Emails
 * 
 * Handles:
 * - Sending encrypted emails (hybrid encryption)
 * - Decrypting received emails
 * - Fetching inbox and sent emails
 * 
 * @module emailService
 */

import { emailAPI, userAPI } from './apiService';
import {
    encryptEmail,
    decryptEmail,
    importPublicKey,
} from '../utils/cryptoUtils';
import { parseAppEmail } from '../utils/addressUtils';

// ============================================================================
// SEND EMAIL
// ============================================================================

/**
 * Send an end-to-end encrypted email
 * 
 * Process:
 * 1. Parse recipient address to get username
 * 2. Fetch recipient's public key
 * 3. Encrypt subject and body with hybrid encryption
 * 4. Send encrypted data to backend
 * 
 * @param {Object} params - Email parameters
 * @param {string} params.toAddress - Recipient address (e.g., "bob@smail.in")
 * @param {string} params.subject - Email subject (plaintext)
 * @param {string} params.body - Email body (plaintext)
 * @param {string} params.senderPublicKeyB64 - Sender's public key (Base64)
 * @param {Array<number>} params.attachmentIds - List of attachment IDs (optional)
 * @returns {Promise<Object>} Backend response
 */
export async function sendEncryptedEmail({ toAddress, subject, body, senderPublicKeyB64, attachmentIds = [] }) {
    try {
        // Parse recipient address to get username
        const recipientUsername = parseAppEmail(toAddress);

        // Fetch recipient's public key
        const response = await userAPI.getPublicKey(recipientUsername);
        const recipientPublicKeyB64 = response.data.publicKey;

        if (!recipientPublicKeyB64) {
            throw new Error(`User ${toAddress} not found`);
        }

        // Import public keys
        const recipientPublicKey = await importPublicKey(recipientPublicKeyB64);
        const senderPublicKey = await importPublicKey(senderPublicKeyB64);

        // Encrypt email for both sender and recipient
        const encrypted = await encryptEmail(subject, body, recipientPublicKey, senderPublicKey);

// Send to backend
        const result = await emailAPI.sendEmail({
            toUsername: recipientUsername,
            encryptedSubject: encrypted.encryptedSubject,
            subjectIv: encrypted.subjectIv,
            encryptedBody: encrypted.encryptedBody,
            bodyIv: encrypted.bodyIv,
            encryptedSymmetricKey: encrypted.encryptedSymmetricKey,
            senderEncryptedSymmetricKey: encrypted.senderEncryptedSymmetricKey,
            attachmentIds: attachmentIds,
        });

        return result;

    } catch (error) {
        console.error('Failed to send encrypted email:', error);
        throw error;
    }
}

// ============================================================================
// DECRYPT EMAIL
// ============================================================================

/**
 * Decrypt an email with user's private key
 * 
 * @param {Object} email - Encrypted email from backend
 * @param {string} email.encryptedSubject - Base64 ciphertext
 * @param {string} email.subjectIv - Base64 IV
 * @param {string} email.encryptedBody - Base64 ciphertext
 * @param {string} email.bodyIv - Base64 IV
 * @param {string} email.encryptedSymmetricKey - Wrapped AES key for recipient
 * @param {string} email.senderEncryptedSymmetricKey - Wrapped AES key for sender
 * @param {Array<number>} email.attachmentIds - Array of attachment IDs
 * @param {CryptoKey} userPrivateKey - User's RSA private key
 * @param {string} viewType - "inbox" or "sent"
 * @returns {Promise<{subject: string, body: string, attachments: Array}>} Decrypted content
 */
export async function decryptEmailMessage(email, userPrivateKey, viewType) {
    try {
        // Validate inputs
        if (!email) {
            throw new Error('Email object is null or undefined');
        }

        if (!userPrivateKey) {
            throw new Error('User private key is required for decryption');
        }

        console.log("🔓 Starting email decryption:", {
            emailId: email.id,
            hasEncryptedSubject: !!email.encryptedSubject,
            hasSubjectIv: !!email.subjectIv,
            hasEncryptedBody: !!email.encryptedBody,
            hasBodyIv: !!email.bodyIv,
            hasEncryptedSymmetricKey: !!email.encryptedSymmetricKey,
            hasSenderEncryptedSymmetricKey: !!email.senderEncryptedSymmetricKey,
            viewType,
            isSender: email.isSender,
            privateKeyType: userPrivateKey?.type,
            privateKeyAlgorithm: userPrivateKey?.algorithm?.name
        });

        // Determine which encrypted key to use
        const encryptedSymmetricKey = (viewType === 'sent' || email.isSender)
            ? email.senderEncryptedSymmetricKey
            : email.encryptedSymmetricKey;

        if (!encryptedSymmetricKey) {
            if (viewType === 'sent' || email.isSender) {
                throw new Error(
                    'This email was sent before sender decryption was enabled and cannot be viewed.'
                );
            } else {
                throw new Error('Missing encryption key for this email.');
            }
        }

        // Validate required fields
        if (!email.encryptedSubject || !email.subjectIv) {
            throw new Error('Missing encrypted subject or IV');
        }
        if (!email.encryptedBody || !email.bodyIv) {
            throw new Error('Missing encrypted body or IV');
        }

        console.log("🔐 About to decrypt subject and body:", {
            encryptedSymmetricKeyLength: encryptedSymmetricKey?.length,
            encryptedSubjectLength: email.encryptedSubject?.length,
            subjectIvLength: email.subjectIv?.length,
            encryptedBodyLength: email.encryptedBody?.length,
            bodyIvLength: email.bodyIv?.length
        });

        // Decrypt subject and body separately (each has its own IV)
        let decryptedSubject;
        try {
            decryptedSubject = await decryptEmail(
                email.encryptedSubject,
                email.subjectIv,
                encryptedSymmetricKey,
                userPrivateKey
            );
            console.log("✅ Subject decrypted successfully:", {
                decryptedLength: decryptedSubject?.length,
                preview: decryptedSubject?.substring(0, 50)
            });
        } catch (subjectError) {
            console.error("❌ Failed to decrypt subject:", {
                error: subjectError.message,
                errorName: subjectError.name
            });
            decryptedSubject = "(Unable to decrypt subject)";
        }

        let decryptedBody;
        try {
            decryptedBody = await decryptEmail(
                email.encryptedBody,
                email.bodyIv,
                encryptedSymmetricKey,
                userPrivateKey
            );
            console.log("✅ Body decrypted successfully:", {
                decryptedLength: decryptedBody?.length,
                preview: decryptedBody?.substring(0, 50)
            });
        } catch (bodyError) {
            console.error("❌ Failed to decrypt body:", {
                error: bodyError.message,
                errorName: bodyError.name
            });
            decryptedBody = "(Unable to decrypt body)";
        }

        // Add attachment IDs to decrypted content
        const decryptedWithAttachments = {
            subject: decryptedSubject,
            body: decryptedBody,
            attachments: email.attachmentIds || []
        };

        console.log("✅ Email decryption complete:", {
            hasSubject: !!decryptedSubject,
            hasBody: !!decryptedBody,
            attachmentCount: decryptedWithAttachments.attachments?.length || 0
        });

        return decryptedWithAttachments;

    } catch (error) {
        console.error('❌ Failed to decrypt email:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack?.substring(0, 200),
            emailId: email?.id
        });
        throw error;
    }
}

// ============================================================================
// FETCH EMAILS
// ============================================================================

/**
 * Fetch inbox emails
 * @returns {Promise<Array>} List of encrypted emails
 */
export async function fetchInbox() {
    try {
        const response = await emailAPI.getInbox();
        return response.data;
    } catch (error) {
        console.error('Failed to fetch inbox:', error);
        throw error;
    }
}

/**
 * Fetch sent emails
 * @returns {Promise<Array>} List of encrypted emails
 */
export async function fetchSent() {
    try {
        const response = await emailAPI.getSent();
        return response.data;
    } catch (error) {
        console.error('Failed to fetch sent emails:', error);
        throw error;
    }
}

/**
 * Mark email as read
 * @param {number} emailId - Email ID
 * @returns {Promise<Object>} Backend response
 */
export async function markEmailAsRead(emailId) {
    try {
        const response = await emailAPI.markAsRead(emailId);
        return response.data;
    } catch (error) {
        console.error('Failed to mark email as read:', error);
        throw error;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    sendEncryptedEmail,
    decryptEmailMessage,
    fetchInbox,
    fetchSent,
    markEmailAsRead,
};
