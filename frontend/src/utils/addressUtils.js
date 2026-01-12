/**
 * Address Utilities for @smail.in Internal Email Addressing
 * 
 * This module handles the custom email address format used internally
 * within the CryptaMail application. All addresses follow the pattern:
 * 
 *   username@smail.in
 * 
 * Where:
 * - username: The unique local part (3-20 chars, alphanumeric + _ .)
 * - @smail.in: The fixed domain for all internal addresses
 * 
 * These are NOT real SMTP email addresses - they are internal identifiers.
 * 
 * @module addressUtils
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * The fixed email domain for all CryptaMail addresses
 * @constant {string}
 */
export const APP_EMAIL_DOMAIN = "smail.in";

/**
 * Regex pattern for valid usernames
 * - 3-20 characters
 * - Alphanumeric, underscore, dot allowed
 * - Must start and end with alphanumeric
 * @constant {RegExp}
 */
const USERNAME_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9._]{1,18}[a-zA-Z0-9])?$/;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a username according to CryptaMail rules
 * 
 * Rules:
 * - 3-20 characters long
 * - Alphanumeric characters, underscore (_), and dot (.) allowed
 * - Must start and end with alphanumeric character
 * - No consecutive dots
 * - No spaces or special characters
 * 
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * isValidUsername("alice")          // true
 * isValidUsername("alice_123")      // true
 * isValidUsername("alice.smith")    // true
 * isValidUsername("ab")             // false (too short)
 * isValidUsername("_alice")         // false (starts with underscore)
 * isValidUsername("alice!")         // false (special char)
 */
export function isValidUsername(username) {
    if (!username || typeof username !== 'string') {
        return false;
    }

    // Check length
    if (username.length < 3 || username.length > 20) {
        return false;
    }

    // Check pattern
    if (!USERNAME_PATTERN.test(username)) {
        return false;
    }

    // Check for consecutive dots
    if (username.includes('..')) {
        return false;
    }

    return true;
}

/**
 * Validate a full email address (username@smail.in)
 * 
 * @param {string} address - Full email address to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * isValidAddress("alice@smail.in")     // true
 * isValidAddress("alice@gmail.com")    // false (wrong domain)
 * isValidAddress("alice")              // false (no domain)
 */
export function isValidAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }

    try {
        const username = parseAppEmail(address);
        return isValidUsername(username);
    } catch {
        return false;
    }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format a username into a full @smail.in address
 * 
 * @param {string} username - The username (local part)
 * @returns {string} Full email address (username@smail.in)
 * @throws {Error} If username is invalid
 * 
 * @example
 * formatAppEmail("alice")     // "alice@smail.in"
 * formatAppEmail("bob_123")   // "bob_123@smail.in"
 */
export function formatAppEmail(username) {
    if (!isValidUsername(username)) {
        throw new Error(
            `Invalid username: "${username}". ` +
            `Usernames must be 3-20 characters, alphanumeric with optional underscores/dots, ` +
            `and must start/end with alphanumeric characters.`
        );
    }

    return `${username}@${APP_EMAIL_DOMAIN}`;
}

// ============================================================================
// PARSING
// ============================================================================

/**
 * Parse a full @smail.in address and extract the username
 * 
 * @param {string} address - Full email address (username@smail.in)
 * @returns {string} The username (local part)
 * @throws {Error} If address format is invalid or domain doesn't match
 * 
 * @example
 * parseAppEmail("alice@smail.in")     // "alice"
 * parseAppEmail("bob@smail.in")       // "bob"
 * parseAppEmail("user@gmail.com")     // throws Error
 * parseAppEmail("invalid")            // throws Error
 */
export function parseAppEmail(address) {
    // Validate input
    if (!address || typeof address !== 'string') {
        throw new Error('Email address must be a non-empty string');
    }

    // Trim whitespace
    address = address.trim();

    // Split into local part and domain
    const parts = address.split('@');

    if (parts.length !== 2) {
        throw new Error(
            `Invalid email format: "${address}". ` +
            `Expected format: username@${APP_EMAIL_DOMAIN}`
        );
    }

    const [localPart, domain] = parts;

    // Validate domain
    if (domain !== APP_EMAIL_DOMAIN) {
        throw new Error(
            `Invalid domain: "${domain}". ` +
            `Only @${APP_EMAIL_DOMAIN} addresses are supported.`
        );
    }

    // Validate local part (username)
    if (!isValidUsername(localPart)) {
        throw new Error(
            `Invalid username: "${localPart}". ` +
            `Usernames must be 3-20 characters, alphanumeric with optional underscores/dots.`
        );
    }

    return localPart;
}

/**
 * Safely parse an email address, returning null instead of throwing
 * 
 * @param {string} address - Email address to parse
 * @returns {string|null} Username if valid, null otherwise
 * 
 * @example
 * tryParseAppEmail("alice@smail.in")     // "alice"
 * tryParseAppEmail("invalid@gmail.com")  // null
 */
export function tryParseAppEmail(address) {
    try {
        return parseAppEmail(address);
    } catch {
        return null;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get descriptive error message for invalid username
 * 
 * @param {string} username - Username to check
 * @returns {string|null} Error message if invalid, null if valid
 */
export function getUsernameError(username) {
    if (!username) {
        return 'Username is required';
    }

    if (username.length < 3) {
        return 'Username must be at least 3 characters';
    }

    if (username.length > 20) {
        return 'Username must be at most 20 characters';
    }

    if (!USERNAME_PATTERN.test(username)) {
        return 'Username can only contain letters, numbers, dots, and underscores';
    }

    if (username.includes('..')) {
        return 'Username cannot contain consecutive dots';
    }

    if (!/^[a-zA-Z0-9]/.test(username)) {
        return 'Username must start with a letter or number';
    }

    if (!/[a-zA-Z0-9]$/.test(username)) {
        return 'Username must end with a letter or number';
    }

    return null;
}

/**
 * Normalize a username (lowercase, trim)
 * 
 * @param {string} username - Username to normalize
 * @returns {string} Normalized username
 * 
 * @example
 * normalizeUsername("  Alice  ")   // "alice"
 * normalizeUsername("BOB_123")     // "bob_123"
 */
export function normalizeUsername(username) {
    if (!username || typeof username !== 'string') {
        return '';
    }

    return username.trim().toLowerCase();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    APP_EMAIL_DOMAIN,
    isValidUsername,
    isValidAddress,
    formatAppEmail,
    parseAppEmail,
    tryParseAppEmail,
    getUsernameError,
    normalizeUsername,
};
