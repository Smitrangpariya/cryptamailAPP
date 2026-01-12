import { useState, useEffect } from 'react';
import CryptaMailLogo from './CryptaMailLogo';

export default function CryptaMailSplash({ onComplete }) {
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowComplete(true);
      if (onComplete) {
        setTimeout(onComplete, 500);
      }
    }, 4000); // Total animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-slate-950 dark:bg-black flex items-center justify-center z-50">
      <div className="relative">
        <CryptaMailLogo width={400} height={400} />

        {/* Continue button */}
        {showComplete && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium animate-fade-in"
            >
              Continue to CryptaMail
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}