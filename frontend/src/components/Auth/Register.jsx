// src/components/Auth/Register.jsx

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    formatAppEmail,
    getUsernameError,
    normalizeUsername,
} from '../../utils/addressUtils';
import GoogleLogin from './GoogleLogin';

export default function Register({ onSwitchToLogin }) {
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
        <div className="auth-container">
            <div className="auth-card">
<div className="auth-header">
                    <h1>CryptaMail</h1>
                    <p>Create your @smail.in account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {(error || authError) && (
                        <div className="error-message">{error || authError}</div>
                    )}

                    {generatingKeys && (
                        <div className="info-message">
                            🔐 Generating encryption keys... This may take a moment.
                        </div>
                    )}

                    {/* Username Field */}
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                            placeholder="alice"
                            disabled={loading || generatingKeys}
                            autoComplete="username"
                            autoFocus
                        />

                        {/* Username validation hint */}
                        {username && getUsernameError(username) && (
                            <small className="form-error">
                                {getUsernameError(username)}
                            </small>
                        )}

                        {/* Valid username preview */}
                        {username && !getUsernameError(username) && (
                            <small className="form-hint">
                                Your email will be: <strong>{displayedAddress}</strong>
                            </small>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="At least 8 characters"
                            disabled={loading || generatingKeys}
                            autoComplete="new-password"
                        />
                    </div>

{/* Date of Birth Field */}
                    <div className="form-group">
                        <label htmlFor="dateOfBirth">Date of Birth</label>
                        <input
                            id="dateOfBirth"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            required
                            max={new Date().toISOString().split('T')[0]}
                            disabled={loading || generatingKeys}
                        />
                        {dateOfBirth && (
                            <small className="form-hint">
                                Age: {calculateAge(dateOfBirth)} years
                                {calculateAge(dateOfBirth) < 14 && (
                                    <span className="form-error ml-2">
                                        (Must be 14+ years)
                                    </span>
                                )}
                            </small>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter password"
                            disabled={loading || generatingKeys}
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || generatingKeys}
                    >
                        {generatingKeys
                            ? 'Generating Keys...'
                            : loading
                            ? 'Creating Account...'
                            : 'Register'}
                    </button>
                </form>

{/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            Or register with
                        </span>
                    </div>
                </div>

                {/* Google OAuth Button (standardized) */}
                <GoogleLogin isRegister={true} />

                {/* Switch to Login */}
                <div className="auth-footer">
                    Already have an account?{' '}
                    <button
                        className="link-button"
                        onClick={onSwitchToLogin}
                        disabled={loading || generatingKeys}
                    >
                        Login
                    </button>
                </div>

                {/* Security Notice */}
                <div className="encryption-notice">
                    🔒 <strong>End-to-End Encrypted</strong>
                    <br />
                    <small>
                        Your encryption keys are generated in your browser.
                        Your private key never leaves your device in plaintext.
                    </small>
                </div>

                <div className="security-warning">
                    ⚠️ <strong>Important:</strong>
                    If you forget your password, you lose access to your encrypted emails.
                    There is no recovery.
                </div>
            </div>
        </div>
    );
}
