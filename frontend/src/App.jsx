// Clean React app with just essential components
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useIdleTimer } from "./hooks/useIdleTimer";
import SecurityLogger from "./utils/securityLogger";
import AuthPage from "./pages/AuthPage";
import UnlockMailbox from "./components/Auth/UnlockMailbox";
import MailApp from "./MailApp";
import CryptaMailSplash from "./components/ui/CryptaMailSplash";
import { GoogleAuthProvider } from "./context/GoogleProvider";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { PageTransition } from "./utils/animation.jsx";

export default function App() {
  const { isAuthenticated, isLocked, initialized, clearSession, user } = useAuth();
  const navigate = useNavigate();

  // ⚠️ SECURITY: Set up idle timer for auto-logout (15 minutes)
  useIdleTimer(() => {
    if (isAuthenticated) {
      if (import.meta.env.DEV) {
        console.warn('⏱️ Session timeout triggered due to inactivity');
      }
      SecurityLogger.logLogout(user?.id || 'unknown', 'session_timeout');
      clearSession();
      navigate('/login', { replace: true });
    }
  }, 15 * 60 * 1000); // 15 minutes

  // Listen for unauthorized events to globally handle session expiry
  useEffect(() => {
    const handleUnauthorized = () => {
      if (isAuthenticated) {
        if (import.meta.env.DEV) {
          console.log('Session expired or invalid. Clearing session and redirecting to login.');
        }
        clearSession();
        // Use setTimeout to avoid race conditions
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 100);
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [isAuthenticated, clearSession, navigate]);

  // Show loading spinner while auth initializes
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing secure mailbox...</p>
        </div>
      </div>
    );
  }

  // Only log in development
  if (import.meta.env.DEV) {
    console.debug('🔐 App state:', { isAuthenticated, isLocked, initialized });
    console.debug('🌐 Environment:', {
      client: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
      api: import.meta.env.VITE_API_BASE_URL
    });
  }

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <GoogleAuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              !isAuthenticated && initialized ? (
                <PageTransition location="login">
                  <AuthPage />
                </PageTransition>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/register"
            element={
              !isAuthenticated && initialized ? (
                <PageTransition location="register">
                  <AuthPage />
                </PageTransition>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/unlock"
            element={
              isAuthenticated && isLocked ? (
                <PageTransition location="unlock">
                  <UnlockMailbox />
                </PageTransition>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/splash"
            element={
              <PageTransition location="splash">
                <CryptaMailSplash onComplete={() => navigate('/login')} />
              </PageTransition>
            }
          />

          <Route
            path="/*"
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : isLocked ? (
                <Navigate to="/unlock" replace />
              ) : (
                <PageTransition location="main">
                  <MailApp />
                </PageTransition>
              )
            }
          />
        </Routes>
      </GoogleAuthProvider>
    </ErrorBoundary>
  );
}