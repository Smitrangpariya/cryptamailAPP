import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function GoogleSignIn({ onGoogleAuthSuccess, onGoogleAuthError }) {
    const { googleSignIn, loading } = useAuth();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        // Load Google API script
        const loadGoogleScript = () => {
            // Check if script is already loaded
            if (document.querySelector('script[src="https://apis.google.com/js/platform.js"]')) {
                setScriptLoaded(true);
                initializeGoogleAuth();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/platform.js';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setScriptLoaded(true);
                initializeGoogleAuth();
            };
            script.onerror = () => {
                console.error('Failed to load Google API script');
                setError('Failed to load Google authentication');
            };
            document.body.appendChild(script);

            return () => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        };

        loadGoogleScript();
    }, []);

    const initializeGoogleAuth = () => {
        if (window.gapi) {
            window.gapi.load('auth2', () => {
                window.gapi.auth2.init({
                    client_id: '738325871972-17u1a4eg758tb79nte81oijres6rachm.apps.googleusercontent.com',
                    scope: 'profile email',
                });
            });
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            setError('');

            if (!window.gapi) {
                throw new Error('Google API not loaded. Please refresh the page.');
            }

            // Initialize auth2 if not already initialized
            if (!window.gapi.auth2) {
                await new Promise((resolve, reject) => {
                    window.gapi.load('auth2', () => {
                        window.gapi.auth2.init({
                            client_id: '738325871972-17u1a4eg758tb79nte81oijres6rachm.apps.googleusercontent.com',
                            scope: 'profile email',
                        }).then(resolve).catch(reject);
                    });
                });
            }

            const auth2 = window.gapi.auth2.getAuthInstance();
            const googleUser = await auth2.signIn();

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

            // Extract date of birth from Google profile if available
            // Note: Google doesn't always provide DOB, so we'll handle this case
            let dateOfBirth = '';
            try {
                // Try to get additional profile info
                const user = googleUser.getAuthResponse();
                if (user && user.profile) {
                    dateOfBirth = user.profile.birthday || '';
                }
            } catch (err) {
                console.log('Date of birth not available from Google');
            }

            await googleSignIn(userData, dateOfBirth);
            onGoogleAuthSuccess(userData);

        } catch (err) {
            const errorMessage = err.message || 'Google sign-in failed';
            setError(errorMessage);
            onGoogleAuthError(errorMessage);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="google-sign-in" style={{ border: '2px solid red', padding: '10px', marginTop: '10px' }}>
            {/* Always show status */}
            <div className="text-xs text-slate-500 mb-2" style={{ color: 'red', fontWeight: 'bold' }}>
                🔍 Google Sign-In Component Visible - {scriptLoaded ? 'Ready' : 'Loading...'}
            </div>
            
            {error && (
                <div className="error-message mb-4">
                    {error}
                </div>
            )}
            
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="btn btn-google w-full flex items-center justify-center gap-3"
                style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dadce0',
                    color: '#3c4043',
                    padding: '10px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = 'none';
                }}
            >
                {googleLoading ? (
                    <>
                        <div className="loading-spinner"></div>
                        Connecting to Google...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </>
                )}
            </button>

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                By signing in with Google, you agree to our terms of service.
                Your Google profile information will be used to create your account.
            </div>

            {/* Fallback for when Google script doesn't load */}
            {!scriptLoaded && (
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                        Refresh page to load Google authentication
                    </button>
                </div>
            )}
        </div>
    );
}