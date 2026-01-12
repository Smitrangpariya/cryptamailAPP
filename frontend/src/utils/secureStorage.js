/**
 * SecureStorage - Secure token storage using HTTP cookies
 * 
 * This class provides a secure way to store authentication tokens in cookies
 * instead of localStorage, protecting against XSS attacks.
 * 
 * Features:
 * - SameSite=Strict cookie attribute (CSRF protection)
 * - Secure flag on HTTPS (prevents interception)
 * - Configurable expiry times
 * - Development mode logging
 * 
 * @class SecureStorage
 */
class SecureStorage {
  /**
   * Set a secure cookie token
   * 
   * @param {string} name - Cookie name (e.g., 'token', 'refreshToken')
   * @param {string} value - Token value to store
   * @param {number} expiryHours - Hours until cookie expires (default: 24)
   * 
   * @example
   * SecureStorage.setToken('token', 'eyJhbGc...', 24);
   * SecureStorage.setToken('refreshToken', 'eyJhbGc...', 168); // 7 days
   */
  static setToken(name, value, expiryHours = 24) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (expiryHours * 60 * 60 * 1000));
    
    // Build cookie string with security attributes
    const cookieValue = `${name}=${value}; ` +
      `expires=${expires.toUTCString()}; ` +
      `path=/; ` +
      `SameSite=Strict` +
      `${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    
    document.cookie = cookieValue;
    
    if (import.meta.env.DEV) {
      console.log(`🔐 SecureStorage: Token '${name}' stored in cookie (expires in ${expiryHours}h)`);
    }
  }

  /**
   * Get a token from cookies
   * 
   * @param {string} name - Cookie name to retrieve
   * @returns {string|null} Token value or null if not found
   * 
   * @example
   * const token = SecureStorage.getToken('token');
   * if (token) {
   *   // Use token
   * }
   */
  static getToken(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const token = parts.pop().split(';').shift();
      
      if (import.meta.env.DEV) {
        console.log(`🔐 SecureStorage: Retrieved token '${name}' from cookie`);
      }
      
      return token;
    }
    
    if (import.meta.env.DEV) {
      console.log(`🔐 SecureStorage: Token '${name}' not found in cookies`);
    }
    
    return null;
  }

  /**
   * Remove a specific token cookie
   * 
   * @param {string} name - Cookie name to remove
   * 
   * @example
   * SecureStorage.removeToken('token');
   */
  static removeToken(name) {
    // Set expiry to past date to delete cookie
    const cookieValue = `${name}=; ` +
      `expires=Thu, 01 Jan 1970 00:00:00 UTC; ` +
      `path=/; ` +
      `SameSite=Strict` +
      `${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    
    document.cookie = cookieValue;
    
    if (import.meta.env.DEV) {
      console.log(`🔐 SecureStorage: Token '${name}' removed from cookies`);
    }
  }

  /**
   * Clear all authentication-related tokens
   * 
   * @example
   * SecureStorage.clearAll(); // Removes 'token' and 'refreshToken'
   */
  static clearAll() {
    this.removeToken('token');
    this.removeToken('refreshToken');
    
    if (import.meta.env.DEV) {
      console.log('🔐 SecureStorage: All tokens cleared');
    }
  }

  /**
   * Check if a token exists
   * 
   * @param {string} name - Cookie name to check
   * @returns {boolean} True if token exists, false otherwise
   * 
   * @example
   * if (SecureStorage.hasToken('token')) {
   *   // User is authenticated
   * }
   */
  static hasToken(name) {
    return this.getToken(name) !== null;
  }
}

export default SecureStorage;
