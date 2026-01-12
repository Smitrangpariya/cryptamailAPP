// ============================================================================
// CONSTANTS
// ============================================================================
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const AES_KEY_LENGTH = 256; // bits
const AES_IV_LENGTH = 12; // 12 bytes for AES-GCM

// ============================================================================
// TEXT DECODING HELPERS
// ============================================================================

/**
 * Safely decode ArrayBuffer to string with proper UTF-8 error handling
 * @param {ArrayBuffer} buffer - The decrypted data to decode
 * @param {string} context - Context for error logging (e.g., "email subject", "filename")
 * @returns {string} Decoded text
 * @throws {Error} If decoding fails completely
 */
export function safeDecodeText(buffer, context = "data") {
  // Validate input
  if (!buffer || buffer.byteLength === 0) {
    throw new Error(`Decrypted ${context} is empty or invalid`);
  }

  // Use TextDecoder with error handling for invalid UTF-8 sequences
  try {
    const decoder = new TextDecoder('utf-8', {
      fatal: true,  // Throw error on invalid UTF-8
      ignoreBOM: true
    });
    const result = decoder.decode(buffer);
    console.log(`✅ Successfully decoded ${context}:`, {
      byteLength: buffer.byteLength,
      textLength: result.length,
      preview: result.substring(0, 50)
    });
    return result;
  } catch (decodeError) {
    console.error(`❌ TextDecoder failed for ${context} - data may be corrupted:`, {
      error: decodeError.message,
      byteLength: buffer.byteLength,
      context
    });

    // Fallback: try with non-fatal mode (replaces invalid sequences with replacement chars)
    try {
      const fallbackDecoder = new TextDecoder('utf-8', { fatal: false });
      const result = fallbackDecoder.decode(buffer);
      console.warn(`⚠️ Used fallback TextDecoder for ${context} - output may contain replacement characters:`, {
        preview: result.substring(0, 50)
      });
      return result;
    } catch (fallbackError) {
      console.error(`❌ Fallback TextDecoder also failed for ${context}:`, fallbackError);
      throw new Error(`Failed to decode decrypted ${context} to text`);
    }
  }
}

// ============================================================================
// BASE64 HELPERS
// ============================================================================
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid stack overflow

  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Return a properly-sized ArrayBuffer (not the raw .buffer property which may be oversized)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

// ============================================================================
// RSA KEY GENERATION & MANAGEMENT
// ============================================================================
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

export async function importPublicKey(pem) {
  const binaryDer = base64ToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

export async function importPrivateKey(pem) {
  const binaryDer = base64ToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

// ============================================================================
// PASSWORD-BASED KEY DERIVATION
// ============================================================================
export async function deriveKeyFromPassword(password, salt, iterations = 100000) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Convert salt to Uint8Array if it's an ArrayBuffer
  const saltArray = salt instanceof ArrayBuffer ? new Uint8Array(salt) : salt;

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltArray,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return key;
}

// ============================================================================
// PRIVATE KEY ENCRYPTION
// ============================================================================
export async function encryptPrivateKey(privateKeyPem, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000; // Use consistent iterations
  const key = await deriveKeyFromPassword(password, salt, iterations);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(privateKeyPem)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    iterations: iterations,
  };
}

export async function decryptPrivateKey(encryptedDataOrObj, password, iv, salt) {
  try {
    let encryptedDataVal = encryptedDataOrObj;
    let ivVal = iv;
    let saltVal = salt;
    let iterations = 100000; // Default iterations

    // Handle object unpacking (fixes LoginResponse mismatch)
    if (typeof encryptedDataOrObj === 'object' && encryptedDataOrObj !== null && !encryptedDataOrObj.byteLength) {
      // It's likely the EncryptedPrivateKey object from LoginResponse or RegisterRequest
      // LoginResponse sends: { ciphertext, iv, salt, iterations }
      // RegisterRequest sends: { encrypted, iv, salt, iterations }
      const obj = encryptedDataOrObj;
      encryptedDataVal = obj.ciphertext || obj.encrypted; // Support both
      ivVal = obj.iv;
      saltVal = obj.salt;
      iterations = obj.iterations || 100000; // Use stored iterations or default

      if (!encryptedDataVal) {
        throw new Error("Missing encrypted data in private key object");
      }
    }

    const key = await deriveKeyFromPassword(
      password,
      base64ToArrayBuffer(saltVal),
      iterations
    );

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArrayBuffer(ivVal),
      },
      key,
      base64ToArrayBuffer(encryptedDataVal)
    );

    return safeDecodeText(decrypted, "private key");
  } catch (error) {
    console.error("Failed to decrypt private key:", error);
    throw new Error("Incorrect password or corrupted data");
  }
}

// ============================================================================
// AES ENCRYPTION
// ============================================================================
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: AES_KEY_LENGTH,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptWithAES(text, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptWithAES(encryptedData, iv, key) {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArrayBuffer(iv),
      },
      key,
      base64ToArrayBuffer(encryptedData)
    );

    return safeDecodeText(decrypted, "AES encrypted data");
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

// ============================================================================
// RSA ENCRYPTION
// ============================================================================
export async function encryptAESKeyWithRSA(aesKey, publicKey) {
  try {
    const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      exportedKey
    );
    const encryptedB64 = arrayBufferToBase64(encrypted);
    return encryptedB64;
  } catch (error) {
    console.error("Failed to wrap AES key with RSA:", error);
    throw new Error("AES key wrapping failed: " + error.message);
  }
}

export async function decryptAESKeyWithRSA(encryptedKeyB64, privateKey) {
  try {
    if (!encryptedKeyB64) {
      throw new Error("Encrypted key is null or undefined");
    }

    if (typeof encryptedKeyB64 !== 'string') {
      throw new Error("Encrypted key must be a string");
    }

    if (!privateKey) {
      throw new Error("Private key is required for decryption");
    }

    // Validate private key properties
    if (!privateKey.type || privateKey.type !== 'private') {
      console.error("❌ Invalid private key:", {
        type: privateKey?.type,
        algorithm: privateKey?.algorithm?.name,
        usages: privateKey?.usages
      });
      throw new Error("Invalid private key: must be a CryptoKey of type 'private'");
    }

    if (!privateKey.algorithm || privateKey.algorithm.name !== 'RSA-OAEP') {
      throw new Error(`Invalid key algorithm: ${privateKey.algorithm?.name}, expected RSA-OAEP`);
    }

    if (!privateKey.usages || !privateKey.usages.includes('decrypt')) {
      throw new Error("Private key does not have 'decrypt' usage");
    }

    const encryptedKey = base64ToArrayBuffer(encryptedKeyB64);

    let rawKey;
    try {
      rawKey = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedKey
      );
    } catch (decryptErr) {
      // RSA decryption failed - likely key mismatch
      console.error("❌ RSA decryption failed:", {
        errorName: decryptErr.name,
        errorMessage: decryptErr.message,
        errorCode: decryptErr.code,
        hint: "The encrypted key cannot be decrypted with this private key. This usually means the private key doesn't match the public key that was used to encrypt the AES key."
      });
      throw decryptErr;
    }

    console.log("✅ AES key unwrapped, raw key length:", {
      rawKeyLength: rawKey.byteLength,
      expectedLength: 32
    });

    // Validate the raw key is the expected size (32 bytes for AES-256)
    if (rawKey.byteLength !== 32) {
      console.warn(`⚠️ Unwrapped key is ${rawKey.byteLength} bytes, expected 32 bytes for AES-256`);
    }

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    console.log("✅ AES key imported successfully:", {
      aesKeyAlgorithm: aesKey?.algorithm?.name,
      aesKeyLength: aesKey?.algorithm?.length,
      aesKeyType: aesKey?.type,
      aesKeyUsages: aesKey?.usages
    });

    return aesKey;
  } catch (error) {
    console.error("❌ Failed to unwrap AES key:", {
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack?.substring(0, 200)
    });
    throw new Error("AES key unwrapping failed: " + error.message);
  }
}

// ============================================================================
// EMAIL ENCRYPTION
// ============================================================================
export async function encryptEmail(subject, body, recipientPublicKey, senderPublicKey) {
  try {
    // Generate a random AES key for symmetric encryption
    const aesKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key

    // Encrypt the subject and body using AES
    const subjectIv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const bodyIv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedSubject = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: subjectIv,
      },
      await window.crypto.subtle.importKey(
        "raw",
        aesKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      ),
      new TextEncoder().encode(subject)
    );

    const encryptedBody = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: bodyIv,
      },
      await window.crypto.subtle.importKey(
        "raw",
        aesKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      ),
      new TextEncoder().encode(body)
    );

    // Encrypt the AES key using the recipient's public key
    const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      recipientPublicKey,
      aesKey
    );

    // Encrypt the AES key using the sender's public key (for sender decryption)
    const senderEncryptedSymmetricKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      senderPublicKey,
      aesKey
    );

    // Convert all to base64 for API transmission
    return {
      encryptedSubject: arrayBufferToBase64(encryptedSubject),
      subjectIv: arrayBufferToBase64(subjectIv.buffer.slice(0, subjectIv.byteLength)),
      encryptedBody: arrayBufferToBase64(encryptedBody),
      bodyIv: arrayBufferToBase64(bodyIv.buffer.slice(0, bodyIv.byteLength)),
      encryptedSymmetricKey: arrayBufferToBase64(encryptedSymmetricKey),
      senderEncryptedSymmetricKey: arrayBufferToBase64(senderEncryptedSymmetricKey),
    };
  } catch (error) {
    console.error("Error during email encryption:", error);
    throw new Error("Email encryption failed: " + error.message);
  }
}

// ============================================================================
// EMAIL DECRYPTION
// ============================================================================
export async function decryptEmail(
  encryptedDataB64,
  ivB64,
  encryptedSymmetricKeyB64,
  userPrivateKey
) {
  try {
    // Unwrap the AES key using user's private key
    const aesKey = await decryptAESKeyWithRSA(encryptedSymmetricKeyB64, userPrivateKey);

    // Decode the IV and encrypted data from base64
    const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
    const encryptedData = base64ToArrayBuffer(encryptedDataB64);

    // Decrypt the data using AES-GCM
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encryptedData
    );

    return safeDecodeText(decrypted, "email content");
  } catch (error) {
    console.error("Failed to decrypt email:", error);
    throw new Error("Email decryption failed: " + error.message);
  }
}

// ============================================================================
// FILE ENCRYPTION
// ============================================================================
export async function encryptFile(
  file,
  recipientPublicKey,
  senderPublicKey
) {
  try {
    const aesKey = await generateAESKey();
    const fileContent = await file.arrayBuffer();

    // 1. Encrypt File Content
    const iv = window.crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      fileContent
    );

    // 2. Encrypt Filename
    const filenameIv = window.crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));
    const encryptedFilenameBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: filenameIv },
      aesKey,
      new TextEncoder().encode(file.name)
    );

    // 3. Wrap AES Key
    const encryptedKeyRecipient = await encryptAESKeyWithRSA(
      aesKey,
      recipientPublicKey
    );
    const encryptedKeySender = await encryptAESKeyWithRSA(
      aesKey,
      senderPublicKey
    );

    return {
      encryptedBlob: new Uint8Array(encryptedContent),
      iv: arrayBufferToBase64(iv),
      encryptedFilename: arrayBufferToBase64(encryptedFilenameBuffer),
      filenameIv: arrayBufferToBase64(filenameIv),
      encryptedKeyRecipient,
      encryptedKeySender,
      mimeType: file.type || "application/octet-stream",
      size: file.size
    };
  } catch (error) {
    console.error("Failed to encrypt file:", error);
    throw new Error("File encryption failed: " + error.message);
  }
}

export async function decryptFile(
  encryptedBlobB64,
  ivB64,
  encryptedKeyB64,
  userPrivateKey
) {
  try {
    const aesKey = await decryptAESKeyWithRSA(encryptedKeyB64, userPrivateKey);
    const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
    const ciphertext = base64ToArrayBuffer(encryptedBlobB64);

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertext
    );

    return decryptedContent;
  } catch (error) {
    console.error("Failed to decrypt file:", error);
    throw new Error("File decryption failed: " + error.message);
  }
}

export async function decryptFilename(
  encryptedFilenameB64,
  filenameIvB64,
  encryptedKeyB64,
  userPrivateKey
) {
  try {
    if (!encryptedFilenameB64) {
      return "unknown_file";
    }

    if (!filenameIvB64) {
      console.warn("Missing filename IV, returning encrypted filename");
      return encryptedFilenameB64.substring(0, 30) + "...";
    }

    if (!encryptedKeyB64) {
      console.warn("Missing encrypted key for filename, returning encrypted filename");
      return encryptedFilenameB64.substring(0, 30) + "...";
    }

    console.log("🔓 Attempting to decrypt filename with:", {
      encryptedFilenameLength: encryptedFilenameB64?.length,
      filenameIvLength: filenameIvB64?.length,
      encryptedKeyLength: encryptedKeyB64?.length,
      hasUserPrivateKey: !!userPrivateKey
    });

    // Unwrap the AES key using the user's private key
    const aesKey = await decryptAESKeyWithRSA(encryptedKeyB64, userPrivateKey);

    console.log("✅ AES key unwrapped for filename decryption");

    // Decode the IV and encrypted data from base64
    const iv = new Uint8Array(base64ToArrayBuffer(filenameIvB64));
    const ciphertext = base64ToArrayBuffer(encryptedFilenameB64);

    console.log("🔐 Decrypting filename with:", {
      ivLength: iv.length,
      ciphertextLength: ciphertext.byteLength,
      aesKeyAlgorithm: aesKey?.algorithm?.name
    });

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertext
    );

    const filename = safeDecodeText(decrypted, "filename");
    console.log("✅ Filename decrypted successfully:", filename);
    return filename;
  } catch (error) {
    console.error("❌ Failed to decrypt filename:", {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack
    });
    // Return a truncated version of the encrypted filename as fallback
    return encryptedFilenameB64?.substring(0, 30) + "..." || "unknown_file";
  }
}

// ============================================================================
// CHUNKED ENCRYPTION HELPERS
// ============================================================================

export async function encryptChunk(chunkBuffer, aesKey) {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      chunkBuffer
    );
    return {
      encryptedData: encrypted, // ArrayBuffer
      iv: iv // Uint8Array
    };
  } catch (error) {
    throw new Error("Chunk encryption failed: " + error.message);
  }
}

export async function decryptChunk(encryptedChunkBuffer, aesKey, ivBuffer) {
  try {
    // Validate AES key
    if (!aesKey) {
      throw new Error('AES key is missing or null');
    }

    if (aesKey?.algorithm?.name !== 'AES-GCM') {
      throw new Error(`Invalid AES key algorithm: ${aesKey?.algorithm?.name}, expected AES-GCM`);
    }

    // Validate encrypted data
    if (!encryptedChunkBuffer) {
      throw new Error("Encrypted chunk data is missing");
    }

    // Convert to Uint8Array if it's an ArrayBuffer
    let encryptedData;
    if (encryptedChunkBuffer instanceof ArrayBuffer) {
      encryptedData = new Uint8Array(encryptedChunkBuffer);
    } else if (encryptedChunkBuffer instanceof Uint8Array) {
      encryptedData = encryptedChunkBuffer;
    } else {
      throw new Error(`Invalid encrypted data type: ${typeof encryptedChunkBuffer}`);
    }

    // Ensure ivBuffer is Uint8Array
    let iv;
    if (typeof ivBuffer === 'string') {
      // If iv is a base64 string, decode it directly
      const binaryString = atob(ivBuffer.trim());
      iv = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        iv[i] = binaryString.charCodeAt(i);
      }
    } else if (ivBuffer instanceof Uint8Array) {
      iv = ivBuffer;
    } else if (ivBuffer instanceof ArrayBuffer) {
      iv = new Uint8Array(ivBuffer);
    } else {
      throw new Error(`Invalid IV type: ${typeof ivBuffer}`);
    }

    // Validate IV length (should be 12 bytes for AES-GCM)
    // For backward compatibility with old uploads that might have extra bytes, take first 12
    if (iv.length < 12) {
      throw new Error(`Invalid IV length: ${iv.length} (expected at least 12 bytes for AES-GCM)`);
    }

    // Use only first 12 bytes if more are present (backward compatibility)
    if (iv.length > 12) {
      console.warn(`⚠️ IV is ${iv.length} bytes, using first 12 bytes`);
      iv = iv.slice(0, 12);
    }

    // Validate encrypted data length
    if (encryptedData.length === 0) {
      throw new Error('Encrypted chunk is empty (0 bytes)');
    }

    // Log decryption details for debugging
    console.log("🔐 Decrypting chunk:", {
      encryptedDataLength: encryptedData.length,
      ivLength: iv.length,
      ivHex: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(' '),
      aesKeyType: aesKey?.constructor?.name,
      aesKeyAlgorithm: aesKey?.algorithm?.name,
      aesKeyLength: aesKey?.algorithm?.length
    });

    try {
      // Decrypt using AES-GCM
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        aesKey,
        encryptedData
      );

      console.log("✅ Chunk decrypted successfully", {
        decryptedLength: decrypted.byteLength
      });

      return decrypted;
    } catch (decryptError) {
      console.error("❌ Decryption operation failed:", {
        error: decryptError.message,
        errorName: decryptError.name,
        encryptedDataLength: encryptedData.length,
        ivLength: iv.length,
        aesKeyType: aesKey?.constructor?.name,
        aesKeyAlgorithm: aesKey?.algorithm?.name,
        aesKeyLength: aesKey?.algorithm?.length,
        operationErrorHint: "This usually means the AES key doesn't match the key used for encryption, or the encrypted data is corrupted"
      });
      throw new Error(`Decryption operation failed: ${decryptError.message}`);
    }
  } catch (error) {
    console.error("❌ Chunk decryption error details:", {
      errorMessage: error.message,
      errorStack: error.stack,
      ivBufferType: ivBuffer?.constructor?.name,
      ivBufferLength: ivBuffer?.length
    });
    throw new Error(`Chunk decryption failed: ${error.message}`);
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================
export default {
  CHUNK_SIZE,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  safeDecodeText,

  generateRSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,

  deriveKeyFromPassword,
  encryptPrivateKey,
  decryptPrivateKey,

  generateAESKey,
  encryptWithAES,
  decryptWithAES,

  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,

  encryptEmail,
  decryptEmail,

  encryptFile,
  decryptFile,
  decryptFilename,

  encryptChunk,
  decryptChunk,
};
