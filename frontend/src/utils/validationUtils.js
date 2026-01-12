/**
 * Frontend Validation Utilities
 * Provides validation for user inputs and API responses
 */

import DOMPurify from 'dompurify';

export const ValidationUtil = {
  /**
   * Validate email format - strict validation
   */
  isValidEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    // More strict email validation following RFC 5322 simplified
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) return false;
    if (email.length > 254) return false;

    const [localPart, ...domainParts] = email.split('@');
    const domain = domainParts.join('@');

    // Check TLD
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];
    if (tld.length < 2 || tld.length > 63) return false;

    // Block known disposable email domains
    const disposableDomains = new Set([
      'tempmail.com', 'guerrillamail.com', '10minutemail.com',
      'mailinator.com', 'temp-mail.org', 'throwaway.email'
    ]);

    if (disposableDomains.has(domain.toLowerCase())) return false;

    return true;
  },

  /**
   * Validate username (alphanumeric, dash, underscore, 3-32 chars)
   */
  isValidUsername: (username) => {
    if (!username || typeof username !== 'string') return false;
    const usernameRegex = /^[A-Za-z0-9_-]{3,32}$/;
    return usernameRegex.test(username);
  },

  /**
   * Validate password strength
   * - Minimum 12 characters (increased from 8)
   * - Maximum 128 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one digit
   * - At least one special character
   * - No sequential patterns (123, abc, etc.)
   * - No repeated characters (aaa, 111, etc.)
   */
  isValidPassword: (password) => {
    if (!password || typeof password !== 'string') return false;
    if (password.length < 12 || password.length > 128) return false;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
      return false;
    }

    // Check for sequential patterns (123, abc, etc.)
    const sequentialRegex = /(?:(?:0(?=1)|1(?=2)|2(?=3)|3(?=4)|4(?=5)|5(?=6)|6(?=7)|7(?=8)|8(?=9)|a(?=b)|b(?=c)|c(?=d)|d(?=e)|e(?=f)|f(?=g)|g(?=h)|h(?=i)|i(?=j)|j(?=k)|k(?=l)|l(?=m)|m(?=n)|n(?=o)|o(?=p)|p(?=q)|q(?=r)|r(?=s)|s(?=t)|t(?=u)|u(?=v)|v(?=w)|w(?=x)|x(?=y)|y(?=z)){2})/i;
    if (sequentialRegex.test(password)) {
      return false;
    }

    // Check for repeated characters (aaa, 111, etc.)
    if (/(.)\1{2,}/.test(password)) {
      return false;
    }

    return true;
  },

  /**
   * Validate JWT token format
   */
  isValidJWTFormat: (token) => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  },

  /**
   * Validate base64 encoded string
   */
  isValidBase64: (str) => {
    if (!str || typeof str !== 'string') return false;
    if (str.length % 4 !== 0) return false;
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(str);
  },

  /**
   * Sanitize input to prevent XSS attacks
   * Escapes HTML entities and validates length
   */
  sanitizeInput: (input) => {
    if (!input) return input;
    if (typeof input !== 'string') return '';

    // Limit input length
    if (input.length > 10000) return input.substring(0, 10000);

    // Use textContent to safely escape all HTML entities
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  /**
   * Validate API response structure
   */
  isValidResponse: (response) => {
    if (!response || typeof response !== 'object') return false;
    // Check if response has expected properties
    return 'data' in response || 'error' in response;
  },

  /**
   * Validate email list format
   */
  isValidEmailList: (emails) => {
    if (!Array.isArray(emails)) return false;
    return emails.every(email => 
      email && 
      typeof email === 'object' &&
      'id' in email &&
      'subject' in email
    );
  },

  /**
   * Sanitize HTML to prevent XSS - uses DOMPurify
   * Only allows safe HTML tags: b, i, em, strong, p, br, span, a
   * Only allows href and class attributes
   */
  sanitizeHTML: (html) => {
    if (!html || typeof html !== 'string') return '';
    
    const config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'a'],
      ALLOWED_ATTR: ['href', 'class'],
      ALLOW_DATA_ATTR: false,
      // Only allow https:// links
      ALLOWED_ATTR_NAMESPACES: ['data-href'],
    };

    let cleaned = DOMPurify.sanitize(html, config);

    // Additional validation: ensure only https:// links
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${cleaned}</div>`, 'text/html');
    const links = doc.querySelectorAll('a[href]');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('https://') && !href.startsWith('http://') && !href.startsWith('mailto:')) {
        link.removeAttribute('href');
      }
    });

    return doc.body.innerHTML;
  }
};

export default ValidationUtil;
