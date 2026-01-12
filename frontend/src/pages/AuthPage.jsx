import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthPanel from '../components/Auth/AuthPanel';
import ParticleBackground from '../components/ui/ParticleBackground';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Tab') {
        // Allow default tab behavior
        return;
      }
      if (e.key === 'Enter' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        // Prevent accidental form submission
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div id="main-content" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-y-auto overflow-x-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <ParticleBackground />
      </div>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="max-w-6xl mx-auto w-full">
          <AuthPanel isSignUp={isSignUp} onToggle={handleToggle} />
        </div>
      </div>
    </div>
  );
}