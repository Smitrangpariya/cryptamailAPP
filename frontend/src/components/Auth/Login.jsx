import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { normalizeUsername } from '../../utils/addressUtils';
import GoogleLogin from './GoogleLogin';

export default function Login({ onSwitchToRegister }) {
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
        <div className="auth-container">
            <div className="auth-card">
<div className="auth-header">
                    <h1>CryptaMail</h1>
                    <p>Login to your @smail.in account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {(error || authError) && (
                        <div className="error-message">{error || authError}</div>
                    )}

                    {decrypting && (
                        <div className="info-message">
                            🔐 Decrypting your private key.
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                            placeholder="alice"
                            disabled={loading || decrypting}
                            autoComplete="username"
                            autoFocus
                        />
                        {username && (
                            <small className="form-hint">
                                Logging in as: {username}@smail.in
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Your password"
                            disabled={loading || decrypting}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || decrypting}
                    >
                        {decrypting ? 'Decrypting...' : loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

{/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            Or sign in with
                        </span>
                    </div>
                </div>

                {/* Google OAuth Button (standardized) */}
                <GoogleLogin />

                <div className="auth-footer">
                    Don't have an account?{' '}
                    <button
                        className="link-button"
                        onClick={onSwitchToRegister}
                        disabled={loading || decrypting}
                    >
                        Register
                    </button>
                </div>

                <div className="encryption-notice">
                    🔒 <strong>Secure Login</strong>
                    <br />
                    <small>
                        Your private key will be decrypted locally using your password.
                        It never leaves your device in plaintext.
                    </small>
                </div>
            </div>
        </div>
    );
}
