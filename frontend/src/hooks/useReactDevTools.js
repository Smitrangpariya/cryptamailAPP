import { useEffect } from 'react';

export function useReactDevTools() {
  useEffect(() => {
    // Check for multiple React instances
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.warn('⚠️ Multiple React instances detected! This could cause white screen issues.');
      console.warn('Check for:');
      console.warn('- Multiple React imports in your app');
      console.warn('- Development vs production build mismatch');
      console.warn('- Browser extensions interfering');
    }
    
    // Check for common white screen causes
    if (!window.google && !window.gapi) {
      console.warn('⚠️ Google APIs not loaded. Check:');
      console.warn('- Google OAuth library installation');
      console.warn('- Browser extensions blocking scripts');
      console.warn('- Network connectivity issues');
    }
    
    return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  }, []);
}