/**
 * SecurityLogger - Security event logging and audit trail system
 * 
 * This class provides comprehensive security event logging for monitoring,
 * auditing, and incident response. All events are logged with timestamps,
 * user context, and environmental information.
 * 
 * Features:
 * - Centralized security event logging
 * - Automatic backend integration (POST /api/security/log)
 * - Graceful failure (doesn't break app if backend unavailable)
 * - Development mode console logging
 * - Comprehensive event types
 * 
 * @class SecurityLogger
 */
class SecurityLogger {
  /**
   * Send security event log to backend
   * 
   * @private
   * @param {Object} eventData - Event data to log
   * @returns {Promise<void>}
   */
  static async sendLog(eventData) {
    try {
      const response = await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok && import.meta.env.DEV) {
        console.warn('⚠️ Security log endpoint returned error:', response.status);
      }
    } catch (error) {
      // Backend might not have the endpoint yet - fail silently in production
      if (import.meta.env.DEV) {
        console.warn('⚠️ Security logging failed (backend endpoint may not exist):', error.message);
      }
    }
  }

  /**
   * Log successful login event
   * 
   * @param {string} userId - User ID who logged in
   * @param {string} username - Username who logged in
   * 
   * @example
   * SecurityLogger.logSuccessfulLogin('user_123', 'alice');
   */
  static logSuccessfulLogin(userId, username) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: 'LOGIN_SUCCESS',
      severity: 'info',
      userId,
      username,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ip: 'client', // Backend should log actual IP
    };

    if (import.meta.env.DEV) {
      console.log('✅ SecurityLogger: Login successful -', username);
    }

    this.sendLog(event);
  }

  /**
   * Log failed login attempt
   * 
   * @param {string} username - Username that attempted login
   * @param {string} reason - Reason for failure (e.g., 'invalid_password', 'user_not_found')
   * 
   * @example
   * SecurityLogger.logFailedLogin('alice', 'invalid_password');
   */
  static logFailedLogin(username, reason) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: 'LOGIN_FAILED',
      severity: 'warning',
      username,
      reason,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ip: 'client',
    };

    if (import.meta.env.DEV) {
      console.warn('❌ SecurityLogger: Login failed -', username, '- Reason:', reason);
    }

    this.sendLog(event);
  }

  /**
   * Log user logout event
   * 
   * @param {string} userId - User ID who logged out
   * @param {string} reason - Reason for logout (e.g., 'user_initiated', 'session_timeout', 'forced')
   * 
   * @example
   * SecurityLogger.logLogout('user_123', 'user_initiated');
   * SecurityLogger.logLogout('user_123', 'session_timeout');
   */
  static logLogout(userId, reason = 'user_initiated') {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: 'LOGOUT',
      severity: 'info',
      userId,
      reason,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.DEV) {
      console.log('🚪 SecurityLogger: Logout -', userId, '- Reason:', reason);
    }

    this.sendLog(event);
  }

  /**
   * Log rate limit exceeded event
   * 
   * @param {string} action - Action that was rate limited (e.g., 'login', 'api_call')
   * @param {string} identifier - Identifier (username, IP, etc.)
   * @param {number} waitSeconds - Seconds to wait before retry
   * 
   * @example
   * SecurityLogger.logRateLimitExceeded('login', 'alice', 300);
   */
  static logRateLimitExceeded(action, identifier, waitSeconds) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'warning',
      action,
      identifier,
      waitSeconds,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.DEV) {
      console.warn('⏱️ SecurityLogger: Rate limit exceeded -', action, '-', identifier, '- Wait:', waitSeconds, 's');
    }

    this.sendLog(event);
  }

  /**
   * Log security violation event
   * 
   * @param {string} violationType - Type of violation (e.g., 'xss_attempt', 'csrf_detected', 'invalid_token')
   * @param {Object} details - Additional details about the violation
   * 
   * @example
   * SecurityLogger.logSecurityViolation('xss_attempt', { 
   *   input: '<script>alert("XSS")</script>',
   *   field: 'email_body' 
   * });
   */
  static logSecurityViolation(violationType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: 'SECURITY_VIOLATION',
      severity: 'critical',
      violationType,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.DEV) {
      console.error('🚨 SecurityLogger: Security violation detected -', violationType, details);
    }

    this.sendLog(event);
  }

  /**
   * Log session timeout event
   * 
   * @param {string} userId - User ID whose session timed out
   * @param {number} idleMinutes - Minutes of inactivity before timeout
   * 
   * @example
   * SecurityLogger.logSessionTimeout('user_123', 15);
   */
  static logSessionTimeout(userId, idleMinutes = 15) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: 'SESSION_TIMEOUT',
      severity: 'info',
      userId,
      idleMinutes,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.DEV) {
      console.log('⏱️ SecurityLogger: Session timeout -', userId, '- Idle:', idleMinutes, 'minutes');
    }

    this.sendLog(event);
  }

  /**
   * Log password change event
   * 
   * @param {string} userId - User ID who changed password
   * @param {boolean} success - Whether password change was successful
   * 
   * @example
   * SecurityLogger.logPasswordChange('user_123', true);
   */
  static logPasswordChange(userId, success) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: success ? 'PASSWORD_CHANGE_SUCCESS' : 'PASSWORD_CHANGE_FAILED',
      severity: success ? 'info' : 'warning',
      userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.DEV) {
      console.log(success ? '✅' : '❌', 'SecurityLogger: Password change -', userId, '-', success ? 'Success' : 'Failed');
    }

    this.sendLog(event);
  }

  /**
   * Log suspicious activity
   * 
   * @param {string} activityType - Type of suspicious activity
   * @param {Object} details - Details about the activity
   * 
   * @example
   * SecurityLogger.logSuspiciousActivity('multiple_failed_logins', { 
   *   username: 'alice', 
   *   attempts: 10, 
   *   timeWindow: '5 minutes' 
   * });
   */
  static logSuspiciousActivity(activityType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'warning',
      activityType,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.DEV) {
      console.warn('⚠️ SecurityLogger: Suspicious activity -', activityType, details);
    }

    this.sendLog(event);
  }

  /**
   * Log generic security event
   * 
   * @param {string} eventType - Type of event
   * @param {string} severity - Severity level ('info', 'warning', 'critical')
   * @param {Object} data - Event data
   * 
   * @example
   * SecurityLogger.logEvent('EMAIL_SENT', 'info', { recipient: 'bob', subject: 'Hello' });
   */
  static logEvent(eventType, severity, data) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      ...data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.DEV) {
      const icon = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(icon, 'SecurityLogger:', eventType, data);
    }

    this.sendLog(event);
  }
}

export default SecurityLogger;
