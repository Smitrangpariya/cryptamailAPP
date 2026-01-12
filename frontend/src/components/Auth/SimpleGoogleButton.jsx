import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function SimpleGoogleButton() {
    const { googleSignIn, loading } = useAuth();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('Loading Google API script...');
        
        // Load Google API script
        const loadGoogleScript = () => {
            // Check if script is already loaded
            if (window.gapi || document.querySelector('script[src*="google.com"]')) {
                console.log('Google script already exists');
                setScriptLoaded(true);
                setTimeout(() => initializeGoogleAuth(), 500);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/platform.js';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                console.log('Google script loaded successfully');
                setScriptLoaded(true);
                setTimeout(() => initializeGoogleAuth(), 1000);
            };
            script.onerror = (err) => {
                console.error('Failed to load Google API script:', err);
                setError('Failed to load Google authentication. Please refresh the page.');
            };
            document.head.appendChild(script);

            return () => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            };
        };

        loadGoogleScript();
    }, []);

const initializeGoogleAuth = () => {
        console.log('Initializing Google auth...');
        if (window.gapi) {
            window.gapi.load('auth2', () => {
                window.gapi.auth2.init({
                    client_id: '738325871972-17u1a4eg758tb79nte81oijres6rachm.apps.googleusercontent.com',
                    scope: 'profile email',
                });
                console.log('Google auth initialized');
            });
        } else {
            console.error('GAPI not available');
        }
    };

    const handleGoogleSignIn = async () => {
        console.log('Google sign-in clicked');
        try {
            setGoogleLoading(true);
            setError('');

            if (!window.gapi || !window.gapi.auth2) {
                throw new Error('Google API not loaded. Please refresh the page.');
            }

            // Get auth2 instance
            const auth2 = window.gapi.auth2.getAuthInstance();

            // Sign in with popup
            const googleUser = await auth2.signIn({
                prompt: 'select_account'
            });

            // Get user profile information
            const profile = googleUser.getBasicProfile();
            const authResponse = googleUser.getAuthResponse();

            const userData = {
                email: profile.getEmail(),
                name: profile.getName(),
                givenName: profile.getGivenName(),
                familyName: profile.getFamilyName(),
                imageUrl: profile.getImageUrl(),
                id: profile.getId(),
                token: authResponse.id_token,
            };

            console.log('Google user data:', userData);

            await googleSignIn(userData, '');

        } catch (err) {
            console.error('Google sign-in error:', err);
            
            let errorMessage = 'Google sign-in failed';
            if (err.response) {
                // API error
                errorMessage = err.response.data?.message || err.response.data || err.response.statusText || 'Server error';
            } else if (err.request) {
                // Network error
                errorMessage = 'Network error. Please check your connection.';
            } else {
                // Other error
                errorMessage = err.message || 'An unexpected error occurred';
            }
            
            setError(errorMessage);
        } finally {
            setGoogleLoading(false);
        }
    };

    const fetchGoogleUserInfo = async (accessToken) => {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }
        return await response.json();
    };

    return (
        <div className="w-full pt-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm p-3 mb-4">
                    {error}
                </div>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
                Google Sign-In {scriptLoaded ? 'Ready' : 'Loading...'}
            </div>
            
            <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                         font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200
                         flex items-center justify-center gap-3 px-4 py-3"
                whileHover={{ scale: loading || googleLoading ? 1 : 1.02 }}
                whileTap={{ scale: loading || googleLoading ? 1 : 0.98 }}
            >
                {googleLoading ? (
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
                        Sign in with Google
                    </>
                )}
            </motion.button>
        </div>
    );
}