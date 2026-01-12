import axios from 'axios';
import SecureStorage from '../utils/secureStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },  
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  // ⚠️ SECURITY: Use SecureStorage instead of localStorage for token
  const token = SecureStorage.getToken("token");

  if (token) {
    // Basic token format validation
    try {
      if (token.split('.').length === 3) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      } else if (import.meta.env.DEV) {
        console.warn('Invalid JWT token format');
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('JWT token validation error', e);
    }
  }

  return config;
});

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (connection refused, timeout, etc.)
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        const networkError = new Error(
          'Unable to connect to the server. Please ensure the backend is running on ' + API_BASE_URL
        );
        networkError.name = 'NetworkError';
        networkError.code = 'ECONNREFUSED';
        if (import.meta.env.DEV) {
          console.error('🌐 Network Error:', networkError.message);
          console.error('💡 Make sure the backend is running on port 8080');
        }
        return Promise.reject(networkError);
      }
      
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        const timeoutError = new Error('Request timed out. The server may be slow or unavailable.');
        timeoutError.name = 'TimeoutError';
        if (import.meta.env.DEV) {
          console.error('⏱️ Timeout Error:', timeoutError.message);
        }
        return Promise.reject(timeoutError);
      }
    }

    // Handle HTTP errors
    if (error.response?.status === 401) {
      // Clear all auth data
      // ⚠️ SECURITY: Clear secure cookies instead of localStorage
      SecureStorage.removeToken("token");
      SecureStorage.removeToken("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("encryptedPrivateKey");
      sessionStorage.removeItem('lastUnlockTime');
      // Dispatch an event that a React component can listen for to handle the redirect.
      window.dispatchEvent(new Event('unauthorized'));
    }
    
    return Promise.reject(error);
  }
);


// Authentication endpoints
export const authAPI = {
    /**
     * Register new user with encrypted private key
     * @param {Object} data - Registration data
     * @param {string} data.username - Username (local part)
     * @param {string} data.password - User password
     * @param {string} data.publicKey - Base64 public key
     * @param {Object} data.encryptedPrivateKey - Encrypted private key blob
     */
    register: (data) => {
        return api.post('/auth/register', data);
    },

    /**
     * Login with username and password
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.username - Username
     * @param {string} credentials.password - Password
     */
login: (credentials) => {
        return api.post('/auth/login', credentials);
    },

    /**
     * Google OAuth registration
     * @param {Object} data - Google registration data
     * @param {string} data.username - Generated username
     * @param {string} data.email - Google email
     * @param {string} data.name - Google display name
     * @param {string} data.googleId - Google user ID
     * @param {string} data.dateOfBirth - Date of birth (if available)
     * @param {string} data.publicKey - Base64 public key
     * @param {Object} data.encryptedPrivateKey - Encrypted private key blob
     * @param {string} data.googleToken - Google OAuth token
     */
    googleRegister: (data) => {
        return api.post('/auth/google-register', data);
    },

    /**
     * Google OAuth login
     * @param {Object} data - Google login data
     * @param {string} data.googleToken - Google OAuth token
     */
    googleLogin: (data) => {
        return api.post('/auth/google-login', data);
    },
};

// User endpoints
export const userAPI = {
    /**
     * Get user's public key by username or address
     * @param {string} usernameOrAddress - Username (e.g., "alice") or full address (e.g., "alice@smail.in")
     */
    getPublicKey: (usernameOrAddress) => {
        // If it contains @, treat as address; otherwise as username
        const paramKey = usernameOrAddress.includes('@') ? 'address' : 'username';
        return api.get('/users/public-key', { params: { [paramKey]: usernameOrAddress } });
    },
    searchUsers: (query) => api.get(`/users/search?query=${query}`),
    updateProfile: (data) => api.put("/users/profile", data),
    getStorageUsage: () => api.get("/users/storage"),
    deleteAccount: (password) => api.delete("/users/account", { data: { password } }),
};

// Email endpoints
export const emailAPI = {
    getInbox: () => {
        return api.get('/emails/inbox');
    },
    getSent: () => {
        return api.get('/emails/sent');
    },
getTrash: () => {
        return api.get('/emails/trash');
    },
    getSpam: () => {
        return api.get('/emails/spam');
    },
    getEmail: (id) => {
        return api.get(`/emails/${id}`);
    },
    saveDraft: (emailData) => {
        return api.post('/emails/drafts', emailData);
    },
    getDrafts: () => api.get("/emails/drafts"),
    deleteDraft: (id) => api.delete(`/emails/drafts/${id}`),
    deleteEmail: (id) => api.delete(`/emails/${id}`),
    /**
     * Send encrypted email
     * @param {Object} emailData - Encrypted email data
     * @param {string} emailData.toUsername - Recipient username
     * @param {string} emailData.encryptedSubject - Base64 encrypted subject
     * @param {string} emailData.subjectIv - Base64 IV for subject
     * @param {string} emailData.encryptedBody - Base64 encrypted body
     * @param {string} emailData.bodyIv - Base64 IV for body
     * @param {string} emailData.encryptedSymmetricKey - Wrapped AES key for recipient
     * @param {string} emailData.senderEncryptedSymmetricKey - Wrapped AES key for sender
     */
    sendEmail: (emailData) => {
        return api.post('/emails/send', emailData);
    },
    markAsRead: (id) => {
        return api.patch(`/emails/${id}/read`);
    },
    permanentlyDeleteEmail: (id) => {
        return api.delete(`/emails/${id}/permanent`);
    },
    emptyTrash: () => {
        return api.delete('/emails/trash/empty');
    },
    markSpam: (id) => {
        return api.patch(`/emails/${id}/spam`);
    },
    markNotSpam: (id) => {
        return api.patch(`/emails/${id}/not-spam`);
    },
    restoreEmail: (id) => {
        return api.patch(`/emails/${id}/restore`);
    },
    toggleStar: (id, isStarred) => {
        return api.patch(`/emails/${id}/star`, { isStarred });
    },
    toggleImportant: (id, isImportant) => {
        return api.patch(`/emails/${id}/important`, { isImportant });
    },
    // Attachments (Phase 2 + Legacy Compat where applicable)
    initAttachment: (data) => api.post('/attachments/init', data),
    uploadChunk: (id, data) => api.post(`/attachments/${id}/chunk`, data),
    getAttachmentStatus: (id) => api.get(`/attachments/${id}/status`),
    completeAttachment: (id) => api.post(`/attachments/${id}/complete`),
    getAttachmentChunk: (id, index) => api.get(`/attachments/${id}/chunks/${index}`),
    getAttachmentMetadata: (id) => api.get(`/attachments/${id}`),
};

export default api;
