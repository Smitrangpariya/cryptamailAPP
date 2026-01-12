/**
 * Rate Limiter - Client-side rate limiting for preventing brute force attacks
 * 
 * This module provides rate limiting functionality to prevent automated attacks
 * and brute force attempts, particularly for login operations.
 * 
 * Features:
 * - Configurable attempt limits and time windows
 * - Per-user tracking (by username)
 * - Automatic cleanup of expired attempts
 * - User-friendly error messages with countdown
 * - Development mode logging
 * 
 * Configuration:
 * - MAX_LOGIN_ATTEMPTS: 5 attempts
 * - WINDOW_MS: 5 minutes (300000ms)
 * 
 * @module rateLimiter
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum number of login attempts allowed
 * @constant {number}
 */
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Time window in milliseconds (5 minutes)
 * @constant {number}
 */
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Storage for tracking login attempts
 * Key: username (lowercase)
 * Value: array of attempt timestamps
 * @type {Map<string, number[]>}
 */
const loginAttempts = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format wait time in human-readable format
 * 
 * @private
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "5m 30s" or "45s")
 */
function formatWaitTime(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Clean up old attempts outside the time window
 * 
 * @private
 * @param {number[]} attempts - Array of attempt timestamps
 * @param {number} now - Current timestamp
 * @returns {number[]} Filtered array of valid attempts
 */
function cleanOldAttempts(attempts, now) {
  return attempts.filter(timestamp => now - timestamp < WINDOW_MS);
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Check if a login attempt is allowed for the given username
 * 
 * Throws an error if the rate limit has been exceeded.
 * The error includes the number of seconds to wait before retrying.
 * 
 * @param {string} username - Username attempting to login
 * @throws {Error} Rate limit exceeded error with waitSeconds property
 * 
 * @example
 * try {
 *   checkLoginRateLimit('alice');
 *   // Proceed with login
 * } catch (error) {
 *   if (error.isRateLimitError) {
 *     console.log(`Wait ${error.waitSeconds} seconds`);
 *   }
 * }
 */
export function checkLoginRateLimit(username) {
  const now = Date.now();
  const key = username.toLowerCase().trim();
  
  // Get existing attempts for this username
  let attempts = loginAttempts.get(key) || [];
  
  // Remove attempts outside the time window
  attempts = cleanOldAttempts(attempts, now);
  
  // Check if limit exceeded
  if (attempts.length >= MAX_LOGIN_ATTEMPTS) {
    // Calculate wait time
    const oldestAttempt = Math.min(...attempts);
    const waitTime = WINDOW_MS - (now - oldestAttempt);
    const waitSeconds = Math.ceil(waitTime / 1000);
    const timeString = formatWaitTime(waitTime);
    
    // Create error with metadata
    const error = new Error(
      `Too many login attempts. Please try again in ${timeString}`
    );
    error.waitSeconds = waitSeconds;
    error.isRateLimitError = true;
    error.username = username;
    
    if (import.meta.env.DEV) {
      console.warn(
        `⏱️ Rate limit exceeded for '${username}' - ` +
        `${attempts.length}/${MAX_LOGIN_ATTEMPTS} attempts - ` +
        `Wait: ${timeString}`
      );
    }
    
    throw error;
  }
  
  // Add current attempt
  attempts.push(now);
  loginAttempts.set(key, attempts);
  
  if (import.meta.env.DEV) {
    console.log(
      `🔐 Login attempt ${attempts.length}/${MAX_LOGIN_ATTEMPTS} for '${username}'`
    );
  }
}

/**
 * Clear rate limit tracking for a username
 * 
 * Should be called after successful login to reset the attempt counter.
 * 
 * @param {string} username - Username to clear rate limit for
 * 
 * @example
 * // After successful login
 * clearLoginRateLimit('alice');
 */
export function clearLoginRateLimit(username) {
  const key = username.toLowerCase().trim();
  const hadAttempts = loginAttempts.has(key);
  
  loginAttempts.delete(key);
  
  if (import.meta.env.DEV && hadAttempts) {
    console.log(`🔐 Rate limit cleared for '${username}'`);
  }
}

/**
 * Get the number of remaining login attempts for a username
 * 
 * @param {string} username - Username to check
 * @returns {number} Number of remaining attempts (0 to MAX_LOGIN_ATTEMPTS)
 * 
 * @example
 * const remaining = getRemainingAttempts('alice');
 * if (remaining <= 2) {
 *   console.warn(`Only ${remaining} attempts remaining!`);
 * }
 */
export function getRemainingAttempts(username) {
  const now = Date.now();
  const key = username.toLowerCase().trim();
  
  let attempts = loginAttempts.get(key) || [];
  attempts = cleanOldAttempts(attempts, now);
  
  const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - attempts.length);
  
  if (import.meta.env.DEV) {
    console.log(`🔐 Remaining attempts for '${username}': ${remaining}`);
  }
  
  return remaining;
}

/**
 * Get time until rate limit resets for a username
 * 
 * @param {string} username - Username to check
 * @returns {number} Milliseconds until reset, or 0 if not rate limited
 * 
 * @example
 * const resetTime = getTimeUntilReset('alice');
 * if (resetTime > 0) {
 *   console.log(`Rate limit resets in ${Math.ceil(resetTime / 1000)} seconds`);
 * }
 */
export function getTimeUntilReset(username) {
  const now = Date.now();
  const key = username.toLowerCase().trim();
  
  let attempts = loginAttempts.get(key) || [];
  attempts = cleanOldAttempts(attempts, now);
  
  if (attempts.length === 0) {
    return 0;
  }
  
  const oldestAttempt = Math.min(...attempts);
  const timeUntilReset = Math.max(0, WINDOW_MS - (now - oldestAttempt));
  
  return timeUntilReset;
}

/**
 * Check if username is currently rate limited
 * 
 * @param {string} username - Username to check
 * @returns {boolean} True if rate limited, false otherwise
 * 
 * @example
 * if (isRateLimited('alice')) {
 *   console.log('User is currently rate limited');
 * }
 */
export function isRateLimited(username) {
  const now = Date.now();
  const key = username.toLowerCase().trim();
  
  let attempts = loginAttempts.get(key) || [];
  attempts = cleanOldAttempts(attempts, now);
  
  return attempts.length >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Get rate limiter statistics
 * 
 * @returns {Object} Statistics object
 * 
 * @example
 * const stats = getRateLimiterStats();
 * console.log(`Tracking ${stats.totalUsers} users with ${stats.totalAttempts} attempts`);
 */
export function getRateLimiterStats() {
  const now = Date.now();
  let totalUsers = 0;
  let totalAttempts = 0;
  let rateLimitedUsers = 0;
  
  for (const [username, attempts] of loginAttempts.entries()) {
    const cleanedAttempts = cleanOldAttempts(attempts, now);
    if (cleanedAttempts.length > 0) {
      totalUsers++;
      totalAttempts += cleanedAttempts.length;
      if (cleanedAttempts.length >= MAX_LOGIN_ATTEMPTS) {
        rateLimitedUsers++;
      }
    }
  }
  
  return {
    totalUsers,
    totalAttempts,
    rateLimitedUsers,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
    windowMinutes: WINDOW_MS / (60 * 1000),
  };
}

/**
 * Clear all rate limit data (for testing or admin purposes)
 * 
 * @example
 * clearAllRateLimits(); // Reset all rate limiting data
 */
export function clearAllRateLimits() {
  const count = loginAttempts.size;
  loginAttempts.clear();
  
  if (import.meta.env.DEV) {
    console.log(`🔐 All rate limits cleared (${count} users)`);
  }
}

// ============================================================================
// MAINTENANCE
// ============================================================================

/**
 * Periodic cleanup of expired rate limit data
 * Runs every 5 minutes to free memory
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [username, attempts] of loginAttempts.entries()) {
      const cleanedAttempts = cleanOldAttempts(attempts, now);
      
      if (cleanedAttempts.length === 0) {
        loginAttempts.delete(username);
        cleanedCount++;
      } else if (cleanedAttempts.length !== attempts.length) {
        loginAttempts.set(username, cleanedAttempts);
      }
    }
    
    if (import.meta.env.DEV && cleanedCount > 0) {
      console.log(`🔐 Rate limiter cleanup: removed ${cleanedCount} expired entries`);
    }
  }, WINDOW_MS); // Run cleanup every window period
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  checkLoginRateLimit,
  clearLoginRateLimit,
  getRemainingAttempts,
  getTimeUntilReset,
  isRateLimited,
  getRateLimiterStats,
  clearAllRateLimits,
  MAX_LOGIN_ATTEMPTS,
  WINDOW_MS,
};
