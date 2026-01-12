import React, { useState } from 'react';

export default function CryptaMailIcon({ size = 48, animated = true }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!animated) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Envelope */}
        <g filter={isHovered || isAnimating ? "url(#iconGlow)" : ""}>
          <rect
            x="12"
            y="18"
            width="24"
            height="14"
            rx="2"
            fill="none"
            stroke="url(#iconGradient)"
            strokeWidth="1.5"
            className={isHovered || isAnimating ? "animate-pulse-slow" : ""}
          />

          <path
            d="M12 20 L24 28 L36 20"
            fill="none"
            stroke="url(#iconGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isHovered || isAnimating ? "animate-pulse-slow" : ""}
          />
        </g>

        {/* Lock icon with micro-interaction */}
        <g transform="translate(24, 25)">
          {/* Lock body */}
          <rect
            x="-3"
            y="-1"
            width="6"
            height="4"
            rx="1"
            fill="url(#iconGradient)"
            className={animated && isAnimating ? "animate-lock-micro" : ""}
          />

          {/* Lock shackle */}
          <path
            d="M-2,-1 A2,2 0 0,1 2,-1"
            fill="none"
            stroke="url(#iconGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={animated && isAnimating ? "animate-shackle-micro" : ""}
          />
        </g>
      </svg>

      {animated && (
        <style>{`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
          
          @keyframes lock-micro {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          
          @keyframes shackle-micro {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-15deg); }
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 2s ease-in-out infinite;
          }
          
          .animate-lock-micro {
            animation: lock-micro 1.5s ease-in-out infinite;
          }
          
          .animate-shackle-micro {
            animation: shackle-micro 1.5s ease-in-out infinite;
          }
        `}</style>
      )}
    </div>
  );
}