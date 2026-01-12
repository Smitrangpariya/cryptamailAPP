import { authAPI } from './apiService';
import { generateRSAKeyPair, encryptPrivateKey, decryptPrivateKey } from '../utils/cryptoUtils';

/**
 * Authentication service for user registration and login.
 * Handles key generation and secure storage.
 */

/**
 * Register a new user.
 * Generates RSA key pair and sends public key to server.
 * Encrypts and stores private key locally.
 */
export async function register(email, password) {
    try {
        // Generate RSA key pair
        const { publicKey, privateKey } = await generateRSAKeyPair();

        // Register user with backend
        const response = await authAPI.register(email, password, publicKey);

        // Store token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userEmail', response.data.email);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('publicKey', publicKey);

        // Encrypt and store private key
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);
        localStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data || 'Registration failed');
    }
}

/**
 * Login existing user.
 * Retrieves and decrypts private key.
 */
export async function login(email, password) {
    try {
        // Login user
        const response = await authAPI.login(email, password);

        // Store token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userEmail', response.data.email);
        localStorage.setItem('userId', response.data.userId);
        if (response.data.publicKey) {
            localStorage.setItem('publicKey', response.data.publicKey);
        }

        // Check if we have encrypted private key
        const encryptedPrivateKey = localStorage.getItem('encryptedPrivateKey');

        if (!encryptedPrivateKey) {
            // First login on this device - generate keys
            const { publicKey, privateKey } = await generateRSAKeyPair();
            const encrypted = await encryptPrivateKey(privateKey, password);
            localStorage.setItem('encryptedPrivateKey', encrypted);
        } else {
            // Verify we can decrypt the key (validates password)
            try {
                await decryptPrivateKey(encryptedPrivateKey, password);
            } catch (e) {
                throw new Error('Failed to decrypt private key. Wrong password?');
            }
        }

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data || error.message || 'Login failed');
    }
}

/**
 * Logout user.
 */
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('publicKey');
    // Note: We keep encryptedPrivateKey for future logins
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated() {
    return !!localStorage.getItem('token');
}

/**
 * Get current user info.
 */
export function getCurrentUser() {
    return {
        email: localStorage.getItem('userEmail'),
        userId: localStorage.getItem('userId'),
    };
}

/**
 * Get decrypted private key.
 * Requires user's password.
 */
export async function getPrivateKey(password) {
    const encryptedPrivateKey = localStorage.getItem('encryptedPrivateKey');
    if (!encryptedPrivateKey) {
        throw new Error('No private key found');
    }
    return await decryptPrivateKey(encryptedPrivateKey, password);
}
