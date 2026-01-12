import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  formatAppEmail,
  getUsernameError,
  normalizeUsername,
} from '../../utils/addressUtils';
import AuthLogo from '../common/Logo';
import GoogleLogin from './GoogleLogin';
import { authVariants } from '../../utils/animation';

export default function RegisterForm({ onToggle }) {
  const { register, loading, error: authError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [generatingKeys, setGeneratingKeys] = useState(false);

  // Handle username field change
  const handleUsernameChange = (e) => {
    const value = normalizeUsername(e.target.value);
    setUsername(value);
    setError('');
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Validate all form fields
  const validateForm = () => {
    const usernameErr = getUsernameError(username);
    if (usernameErr) {
      setError(usernameErr);
      return false;
    }

    if (!dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 14) {
      setError('You must be at least 14 years old to register');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    return true;
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setGeneratingKeys(true);
      await register(username, password, dateOfBirth);
      // AuthContext will auto-login or redirect
    } catch (err) {
      setError(err.message || 'Registration failed');
      setGeneratingKeys(false);
    }
  };

  // Safe address preview (avoids crash)
  let displayedAddress = '';
  if (username && !getUsernameError(username)) {
    try {
      displayedAddress = formatAppEmail(username);
    } catch {
      displayedAddress = '';
    }
  }

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AuthLogo />

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {(error || authError) && (
          <motion.div 
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error || authError}
          </motion.div>
        )}

        <div className="space-y-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Choose a username"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       transition-all duration-200"
              disabled={loading || generatingKeys}
              autoComplete="username"
            />
            {displayedAddress && (
              <motion.p 
                className="mt-1 text-xs text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                Your email: {displayedAddress}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Create a strong password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       transition-all duration-200"
              disabled={loading || generatingKeys}
              autoComplete="new-password"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       transition-all duration-200"
              disabled={loading || generatingKeys}
              autoComplete="new-password"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <label htmlFor="reg-dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date of Birth
            </label>
            <input
              id="reg-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                setError('');
              }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       transition-all duration-200"
              disabled={loading || generatingKeys}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 14 years old
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="space-y-4"
        >
          <motion.button
            type="submit"
            disabled={loading || generatingKeys || !username || !password || !confirmPassword || !dateOfBirth}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 
                     text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none 
                     transition-all duration-300 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 relative overflow-hidden group"
            whileHover={{ scale: loading || generatingKeys ? 1 : 1.02 }}
            whileTap={{ scale: loading || generatingKeys ? 1 : 0.98 }}
          >
            {(loading || generatingKeys) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {generatingKeys ? 'Generating Keys...' : 'Creating Account...'}
              </>
            ) : (
              'Create Account'
            )}
          </motion.button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleLogin isRegister={true} />
        </motion.div>
      </motion.form>
    </motion.div>
  );
}