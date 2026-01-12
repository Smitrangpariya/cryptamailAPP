import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/apiService';
import { useState } from 'react';

export default function GoogleLogin({ isRegister = false }) {
  const { googleSignIn } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError('');
      try {
        const response = await authAPI.googleLogin({
          googleToken: tokenResponse.access_token,
        });
        
        if (response.data) {
          await googleSignIn(response.data);
        }
      } catch (err) {
        console.error('Error processing Google login:', err);
        setError('Failed to process Google login. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      setError('Google login failed. Please try again.');
      setIsLoading(false);
    }
  });

  const handleGoogleLogin = () => {
    login();
  };

  return (
    <div className="w-full">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                   rounded-lg text-red-600 dark:text-red-400 text-sm mb-4"
        >
          {error}
        </motion.div>
      )}
      <motion.button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-md hover:shadow-lg 
                 transition-all duration-200 flex items-center justify-center gap-3 px-4 py-3
                 disabled:opacity-60 disabled:cursor-not-allowed 
                 hover:bg-gray-50 dark:hover:bg-gray-600"
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Connecting to Google...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isRegister ? 'Sign up with Google' : 'Sign in with Google'}
          </>
        )}
      </motion.button>
    </div>
  );
}
