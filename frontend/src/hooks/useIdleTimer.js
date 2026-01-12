/**
 * useIdleTimer Hook
 * Detects user inactivity and triggers auto-logout
 * Monitors: mousedown, mousemove, keypress, scroll, touchstart
 * Timeout: 15 minutes (900000ms)
 */

import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimer(onIdle, timeoutMs = 15 * 60 * 1000) {
  const timeoutIdRef = useRef(null);
  const isIdleRef = useRef(false);

  /**
   * Reset the idle timer
   */
  const resetTimer = useCallback(() => {
    if (isIdleRef.current) {
      if (import.meta.env.DEV) {
        console.log('⏱️ User activity detected, resetting idle timer');
      }
      isIdleRef.current = false;
    }

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Set new timeout
    timeoutIdRef.current = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.warn('⏱️ Idle timeout reached, triggering logout');
      }
      isIdleRef.current = true;
      onIdle();
    }, timeoutMs);
  }, [timeoutMs, onIdle]);

  /**
   * Activity event handler
   */
  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetTimer();

    return () => {
      // Clean up event listeners
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      // Clear timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [handleActivity, resetTimer]);

  /**
   * Manually reset the idle timer (for testing or explicit reset)
   */
  const manualReset = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('⏱️ Idle timer manually reset');
    }
    resetTimer();
  }, [resetTimer]);

  return {
    resetTimer: manualReset,
    isIdle: () => isIdleRef.current,
  };
}

export default useIdleTimer;

