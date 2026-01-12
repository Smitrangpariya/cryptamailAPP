import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/apiService";
import SecureStorage from "../utils/secureStorage";
import SecurityLogger from "../utils/securityLogger";
import { checkLoginRateLimit } from "../utils/rateLimiter";
import {
  generateRSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  encryptPrivateKey,
  importPrivateKey,
  decryptPrivateKey,
} from "../utils/cryptoUtils";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }) {
  // ⚠️ SECURITY: Use SecureStorage (cookies) instead of localStorage for tokens
  const [token, setToken] = useState(() => SecureStorage.getToken("token"));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      if (import.meta.env.DEV) console.error('Failed to parse user from localStorage', e);
      localStorage.removeItem("user");
      return null;
    }
  });
  const [encryptedPrivateKey, setEncryptedPrivateKey] = useState(() => {
    try {
      const raw = localStorage.getItem("encryptedPrivateKey");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      if (import.meta.env.DEV) console.error('Failed to parse encryptedPrivateKey from localStorage', e);
      localStorage.removeItem("encryptedPrivateKey");
      return null;
    }
  });
  const [privateKey, setPrivateKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState(() => {
    // Check if session was recently unlocked (within last 5 minutes)
    const lastUnlock = sessionStorage.getItem('lastUnlockTime');
    if (lastUnlock) {
      const timeSinceUnlock = Date.now() - parseInt(lastUnlock, 10);
      return timeSinceUnlock < 5 * 60 * 1000; // 5 minutes
    }
    return false;
  });
  // Store the decrypted private key temporarily during this session
  const [sessionPrivateKey, setSessionPrivateKey] = useState(null);

  const isAuthenticated = !!token && !!user;
  // If we don't have the private key, we are locked regardless of session timer
  // The session timer is only useful if we were persisting the key (which we aren't currently for security)
  const isLocked = isAuthenticated && !privateKey && !!encryptedPrivateKey;

  // Initialize auth state on mount
  useEffect(() => {
    // On page load, check if session was recently unlocked
    // If yes, don't force re-lock. If no, clear private key.
    if (!sessionUnlocked) {
      setPrivateKey(null);
    }

    if (import.meta.env.DEV) {
      console.debug('🔐 Auth initialization:', {
        hasToken: !!token,
        hasUser: !!user,
        hasEncryptedKey: !!encryptedPrivateKey,
        hasPrivateKey: !!privateKey,
        sessionUnlocked,
        isAuthenticated,
        isLocked
      });
    }

    // Delay initialization to ensure all state is settled
    setTimeout(() => {
      setInitialized(true);
    }, 100);
  }, []); // Only run on mount

  // Log state changes only in development
  useEffect(() => {
    if (initialized && import.meta.env.DEV) {
      console.debug('🔐 Auth state changed:', {
        isAuthenticated,
        isLocked,
        hasEncryptedKey: !!encryptedPrivateKey,
        hasPrivateKey: !!privateKey
      });
    }
  }, [isAuthenticated, isLocked, encryptedPrivateKey, privateKey, initialized]);

  // LOGIN
  const login = async (username, password) => {
    setLoading(true);
    setError("");
    try {
      if (!username || !password) {
        throw new Error("Username and password are required");
      }

      // ⚠️ SECURITY: Check rate limiting before attempting login
      try {
        checkLoginRateLimit(username);
      } catch (rateLimitError) {
        SecurityLogger.logRateLimitExceeded('login', username, rateLimitError.waitSeconds);
        setError(rateLimitError.message);
        setLoading(false);
        throw rateLimitError;
      }

      const response = await authAPI.login({ username, password });

      if (!response?.data) {
        throw new Error("Invalid response from server");
      }

      const {
        token,
        userId,
        username: u,
        address,
        publicKey,
        encryptedPrivateKey,
      } = response.data;

      if (!token || !userId) {
        throw new Error("Missing required auth data from server");
      }

      const userDto = {
        id: userId,
        username: u || username,
        address,
        publicKey,
        loading: false,
        error: "",
        isAuthenticated: true,
        isLocked: false, // Will auto-unlock with password
      };

      setUser(userDto);
      setEncryptedPrivateKey(encryptedPrivateKey || null);
      setToken(token);

      // ⚠️ SECURITY: Store token in secure cookie instead of localStorage
      SecureStorage.setToken("token", token, 24);

      localStorage.setItem("user", JSON.stringify(userDto));
      if (encryptedPrivateKey) {
        localStorage.setItem("encryptedPrivateKey", JSON.stringify(encryptedPrivateKey));

        // Automatically decrypt private key using login password
        try {
          const privateKeyB64 = await decryptPrivateKey(encryptedPrivateKey, password);
          const privateKeyObj = await importPrivateKey(privateKeyB64);
          setPrivateKey(privateKeyObj);
          setSessionPrivateKey(privateKeyB64);
          setSessionUnlocked(true);
          sessionStorage.setItem('lastUnlockTime', Date.now().toString());
        } catch (decryptError) {
          if (import.meta.env.DEV) console.warn("Auto-decrypt failed, user will see unlock page:", decryptError.message);
          setPrivateKey(null);
        }
      } else {
        setPrivateKey(null);
      }

      // Log successful login
      setLoading(false);
      return response;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      setLoading(false);
      throw err;
    }
  };

  // REGISTER
  const register = async (username, password, dateOfBirth) => {
    setLoading(true);
    setError("");
    try {
      // Generate RSA key pair for the user
      const { publicKey, privateKey } = await generateRSAKeyPair();
      const publicKeyB64 = await exportPublicKey(publicKey);
      const privateKeyB64 = await exportPrivateKey(privateKey);

      // Use user's password to encrypt the private key
      const encrypted = await encryptPrivateKey(privateKeyB64, password);

      const response = await authAPI.register({
        username,
        password,
        dateOfBirth,
        publicKey: publicKeyB64,
        encryptedPrivateKey: encrypted,
      });

      const {
        token,
        userId,
        address,
        encryptedPrivateKey: encryptedKey,
      } = response.data;

      const userDto = {
        id: userId,
        username,
        address,
        publicKey: publicKeyB64,
        loading: false,
        error: "",
        isAuthenticated: true,
        isLocked: false, // Will auto-unlock with password just used
      };

      setUser(userDto);
      setEncryptedPrivateKey(encryptedKey);
      // Store the private key we just generated in this session
      setPrivateKey(privateKey);
      setSessionPrivateKey(privateKeyB64);
      setSessionUnlocked(true);
      sessionStorage.setItem('lastUnlockTime', Date.now().toString());
      setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userDto));
      localStorage.setItem("encryptedPrivateKey", JSON.stringify(encryptedKey));
      console.log('📝 Registration: saved encrypted key:', encryptedKey);

      setLoading(false);
      return response;
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
      setLoading(false);
      throw err;
    }
  };

  // UNLOCK MAILBOX
  const unlockMailbox = async (password) => {
    setLoading(true);
    setError("");

    if (!encryptedPrivateKey) {
      throw new Error("No encrypted private key found");
    }

    try {
      if (import.meta.env.DEV) {
        console.log('🔓 Unlock attempt:', {
          hasEncryptedKey: !!encryptedPrivateKey,
          encryptedKeyFields: encryptedPrivateKey ? Object.keys(encryptedPrivateKey) : null
        });
      }

      // Decrypt private key using password
      const privateKeyB64 = await decryptPrivateKey(encryptedPrivateKey, password);
      if (import.meta.env.DEV) console.log('🔓 Decryption successful, got base64 string length:', privateKeyB64?.length);

      // Import the decrypted private key to get CryptoKey object
      let privateKey;
      try {
        privateKey = await importPrivateKey(privateKeyB64);
        if (import.meta.env.DEV) console.log('🔓 Import successful, key type:', privateKey?.type);
      } catch (importError) {
        if (import.meta.env.DEV) console.error('🔓 Import failed:', importError);
        throw new Error('Failed to import decrypted private key: ' + importError.message);
      }

      // Use the existing public key from user object (no need to re-export)
      const publicKey = user.publicKey;
      if (import.meta.env.DEV) console.log('🔓 Using existing public key from user object');

      // Update user state
      const updatedUser = {
        ...user,
        isLocked: false,
        publicKey: publicKey,
      };

      setUser(updatedUser);
      setPrivateKey(privateKey);
      // KEEP encryptedPrivateKey in storage for page refresh scenario
      // Mark session as unlocked with timestamp
      setSessionUnlocked(true);
      sessionStorage.setItem('lastUnlockTime', Date.now().toString());
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return { success: true };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("🔓 Mailbox unlock error:", err);
        console.error("🔓 Encrypted key data:", encryptedPrivateKey);
      }
      setError(err.message || "Failed to unlock mailbox");
      setLoading(false);
      throw err;
    }
  };

  // GOOGLE SIGN IN
  const googleSignIn = async (googleUserData, password = '') => {
    setLoading(true);
    setError("");
    try {
      // Call the Google login API
      const response = await authAPI.googleLogin({
        googleToken: googleUserData.token,
      });

      const {
        token,
        userId,
        username: u,
        address,
        publicKey,
        encryptedPrivateKey,
      } = response.data;

      const userDto = {
        id: userId,
        username: u,
        address,
        publicKey,
        email: googleUserData.email,
        name: googleUserData.name,
        imageUrl: googleUserData.imageUrl,
        loading: false,
        error: "",
        isAuthenticated: true,
        isLocked: false,
      };

      setUser(userDto);
      setEncryptedPrivateKey(encryptedPrivateKey);
      setPrivateKey(null); // Will be set after decryption if needed
      setToken(token);

      // ⚠️ SECURITY: Store token in secure cookie instead of localStorage
      SecureStorage.setToken("token", token, 24);

      localStorage.setItem("user", JSON.stringify(userDto));
      if (encryptedPrivateKey) {
        localStorage.setItem("encryptedPrivateKey", JSON.stringify(encryptedPrivateKey));
      }

      // Log successful login
      SecurityLogger.logSuccessfulLogin(userId, u);

      return response;
    } catch (err) {
      if (import.meta.env.DEV) console.error("Google sign-in error:", err);

      // Log failed login
      SecurityLogger.logFailedLogin(googleUserData?.email || 'unknown', 'google_signin_failed');

      setError(err.message || "Google sign-in failed");
      setLoading(false);
      throw err;
    }
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);
    setPrivateKey(null);
    setEncryptedPrivateKey(null);
    setSessionUnlocked(false);

    // ⚠️ SECURITY: Clear secure cookies instead of localStorage
    SecureStorage.removeToken("token");
    SecureStorage.removeToken("refreshToken");

    localStorage.removeItem("user");
    localStorage.removeItem("encryptedPrivateKey");
    sessionStorage.removeItem('lastUnlockTime');

    // Log logout event
    SecurityLogger.logLogout(user?.id || 'unknown', 'user_initiated');
  };

  // CLEAR SESSION (for account deletion)
  const clearSession = () => {
    logout(); // Reuse logout logic
    // Additional cleanup if needed
  };

  // CONTEXT VALUE
  const value = {
    user,
    token,
    privateKey,
    encryptedPrivateKey,
    loading,
    error,
    isAuthenticated,
    isLocked,
    initialized,
    login,
    register,
    unlockMailbox,
    logout,
    clearSession,
    googleSignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}