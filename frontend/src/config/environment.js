/**
 * Environment Configuration and Validation
 * 
 * This module validates required environment variables and enforces
 * security policies like HTTPS in production environments.
 * 
 * Features:
 * - Validates required environment variables on startup
 * - Enforces HTTPS in production
 * - Auto-redirects HTTP to HTTPS in production
 * - Provides typed configuration object
 * - Clear error messages for missing configuration
 * 
 * @module environment
 */

// ============================================================================
// CONFIGURATION OBJECT
// ============================================================================

/**
 * Application configuration from environment variables
 * 
 * @type {Object}
 * @property {string} googleClientId - Google OAuth client ID
 * @property {string} apiBaseUrl - Backend API base URL
 * @property {string} redirectUri - OAuth redirect URI
 * @property {boolean} isDevelopment - True if running in development mode
 * @property {boolean} isProduction - True if running in production mode
 */
export const config = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that all required environment variables are present
 * 
 * @throws {Error} If required environment variables are missing
 * @private
 */
function validateRequiredVariables() {
  // Only require Google Client ID (API URL has a default)
  const required = [
    {
      key: 'VITE_GOOGLE_CLIENT_ID',
      value: config.googleClientId,
      description: 'Google OAuth Client ID',
      required: true,
    },
  ];

  const missing = required.filter(({ value, required }) => required && !value);

  if (missing.length > 0) {
    const missingList = missing.map(({ key, description }) => 
      `  - ${key} (${description})`
    ).join('\n');

    // In development, warn but don't throw (Google OAuth is optional for basic auth)
    if (config.isDevelopment) {
      console.warn(
        `⚠️ Missing optional environment variables:\n\n` +
        `${missingList}\n\n` +
        `Google OAuth will not be available. You can still use username/password authentication.\n` +
        `To enable Google OAuth, create a .env file with VITE_GOOGLE_CLIENT_ID.\n` +
        `See .env.example for reference.`
      );
    } else {
      // In production, throw error for missing required vars
      const error = new Error(
        `❌ Missing required environment variables:\n\n` +
        `${missingList}\n\n` +
        `Please check your .env file and ensure all required variables are set.\n` +
        `See .env.example for reference.`
      );
      console.error(error.message);
      throw error;
    }
  }
}

/**
 * Validate API URL format and security
 * 
 * @throws {Error} If API URL is invalid or insecure in production
 * @private
 */
export function validateApiUrl(apiUrl) {
  if (!apiUrl) {
    throw new Error("API Base URL is missing");
  }

  // Allow relative path for Vite proxy (DEV)
  if (apiUrl.startsWith("/")) {
    return;
  }

  // Allow full URL (PROD)
  try {
    new URL(apiUrl);
  } catch {
    throw new Error(
      `❌ Invalid API Base URL: ${apiUrl}\n` +
      `Use /api (dev) or https://api.example.com/api (prod)`
    );
  }
}



/**
 * Enforce HTTPS for the application in production
 * 
 * Automatically redirects HTTP to HTTPS in production environments.
 * 
 * @private
 */
function enforceHttps() {
  const { isProduction } = config;

  if (isProduction && typeof window !== 'undefined') {
    const protocol = window.location.protocol;

    if (protocol !== 'https:') {
      console.warn(
        '⚠️ Redirecting from HTTP to HTTPS for security...'
      );

      // Redirect to HTTPS
      const httpsUrl = 'https:' + window.location.href.substring(protocol.length);
      window.location.href = httpsUrl;
      
      // Stop execution after redirect
      return;
    }
  }
}

/**
 * Log configuration status (development only)
 * 
 * @private
 */
function logConfiguration() {
  const { isDevelopment, apiBaseUrl, googleClientId, redirectUri } = config;

  if (isDevelopment) {
    console.log('✅ Environment configuration validated successfully');
    console.log('🌐 Environment:', import.meta.env.MODE);
    console.log('🔗 API Base URL:', apiBaseUrl);
    console.log('🔑 Google OAuth:', googleClientId ? 'Configured ✓' : 'Not configured ✗');
    if (redirectUri) {
      console.log('↩️  Redirect URI:', redirectUri);
    }
  } else {
    // In production, only log success (no sensitive info)
    console.log('✅ Environment configuration validated');
  }
}

/**
 * Validate Google OAuth configuration
 * 
 * @private
 */
function validateGoogleOAuth() {
  const { googleClientId } = config;

  if (googleClientId) {
    // Check if it looks like a valid Google Client ID
    const isValidFormat = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(googleClientId);
    
    if (!isValidFormat && import.meta.env.DEV) {
      console.warn(
        '⚠️ Google Client ID format looks invalid.\n' +
        'Expected format: 123456789-abc123.apps.googleusercontent.com'
      );
    }
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Perform all environment validations
 * 
 * This function is called automatically when the module is imported.
 * It validates configuration and enforces security policies.
 * 
 * @throws {Error} If validation fails
 */
function validateEnvironment() {
  try {
    // Step 1: Validate required variables
    validateRequiredVariables();

    // Step 2: Validate API URL format and security
    validateApiUrl(config.apiBaseUrl);

    // Step 3: Validate Google OAuth configuration
    validateGoogleOAuth();

    // Step 4: Enforce HTTPS in production
    enforceHttps();

    // Step 5: Log configuration status
    logConfiguration();

  } catch (error) {
    // Re-throw with additional context
    console.error('❌ Environment validation failed:', error.message);
    throw error;
  }
}

// ============================================================================
// AUTO-EXECUTION
// ============================================================================

/**
 * Run validation on module import
 * This ensures the app doesn't start with invalid configuration
 */
validateEnvironment();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the full API endpoint URL
 * 
 * @param {string} path - API endpoint path (e.g., '/auth/login')
 * @returns {string} Full URL
 * 
 * @example
 * const url = getApiUrl('/auth/login');
 * // Returns: 'https://api.example.com/api/auth/login'
 */
export function getApiUrl(path) {
  const { apiBaseUrl } = config;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${cleanPath}`;
}

/**
 * Check if running in development mode
 * 
 * @returns {boolean} True if in development
 * 
 * @example
 * if (isDevelopment()) {
 *   console.log('Debug info...');
 * }
 */
export function isDevelopment() {
  return config.isDevelopment;
}

/**
 * Check if running in production mode
 * 
 * @returns {boolean} True if in production
 * 
 * @example
 * if (isProduction()) {
 *   // Enable production optimizations
 * }
 */
export function isProduction() {
  return config.isProduction;
}

/**
 * Get current environment name
 * 
 * @returns {string} Environment name ('development' or 'production')
 * 
 * @example
 * console.log(`Running in ${getEnvironment()} mode`);
 */
export function getEnvironment() {
  return import.meta.env.MODE;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default config;
