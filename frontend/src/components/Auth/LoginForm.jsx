import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { normalizeUsername } from '../../utils/addressUtils';
import AuthLogo from '../common/Logo';
import GoogleLogin from './GoogleLogin';
import { authVariants } from '../../utils/animation';

export default function LoginForm({ onToggle }) {
  const { login, loading, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [decrypting, setDecrypting] = useState(false);

  const handleUsernameChange = (e) => {
    const value = normalizeUsername(e.target.value);
    setUsername(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setDecrypting(true);
      await login(username, password);
      // On success, AuthContext will handle navigation
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setDecrypting(false);
    }
  };

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      variants={authVariants.container}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={authVariants.logo}>
        <AuthLogo />
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        variants={authVariants.form}
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
          <motion.div variants={authVariants.field}>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       transition-all duration-200"
              disabled={loading || decrypting}
              autoComplete="username"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              @smail.in
            </p>
          </motion.div>

          <motion.div variants={authVariants.field}>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       transition-all duration-200"
              disabled={loading || decrypting}
              autoComplete="current-password"
            />
          </motion.div>
        </div>

        <motion.div variants={authVariants.field} className="space-y-4">
          <motion.button
            type="submit"
            disabled={loading || decrypting || !username || !password}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 
                     text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none 
                     transition-all duration-300 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 relative overflow-hidden group"
            whileHover={{ scale: loading || decrypting ? 1 : 1.02 }}
            whileTap={{ scale: loading || decrypting ? 1 : 0.98 }}
          >
            {(loading || decrypting) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {decrypting ? 'Decrypting...' : 'Signing In...'}
              </>
            ) : (
              'Sign In'
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

          <GoogleLogin />
        </motion.div>
      </motion.form>
    </motion.div>
  );
}