import React from 'react';

export default function CryptaMailLoader({ size = 120 }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          <filter id="loaderGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background particles */}
        {[...Array(8)].map((_, i) => (
          <circle
            key={`bg-${i}`}
            cx={60 + Math.cos(i * 45 * Math.PI / 180) * 40}
            cy={60 + Math.sin(i * 45 * Math.PI / 180) * 40}
            r="1"
            fill="#06B6D4"
            opacity="0.3"
            className="animate-spin-slow"
            style={{
              transformOrigin: '60px 60px',
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}

        {/* Rotating envelope */}
        <g className="animate-rotate" filter="url(#loaderGlow)">
          {/* Envelope body */}
          <rect
            x="35"
            y="45"
            width="50"
            height="30"
            rx="4"
            fill="none"
            stroke="url(#loaderGradient)"
            strokeWidth="2"
            opacity="0.9"
          />

          {/* Envelope flap */}
          <path
            d="M35 50 L60 65 L85 50"
            fill="none"
            stroke="url(#loaderGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>

        {/* Flowing encrypted dots */}
        {[...Array(6)].map((_, i) => (
          <circle
            key={`dot-${i}`}
            r="2"
            fill="#8B5CF6"
            className="animate-flow-in"
            style={{
              animationDelay: `${i * 0.3}s`
            }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -20,0; -20,10; 0,10; 0,0"
              dur="3s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Brief lock appearance */}
        <g className="animate-lock-brief" transform="translate(60, 60)">
          <rect
            x="-4"
            y="-1"
            width="8"
            height="6"
            rx="1"
            fill="url(#loaderGradient)"
            opacity="0"
          >
            <animate attributeName="opacity" values="0;1;0" dur="1s" begin="2s" repeatCount="indefinite" />
          </rect>
          <path
            d="M-2,-1 A2,2 0 0,1 2,-1"
            fill="none"
            stroke="url(#loaderGradient)"
            strokeWidth="1.5"
            opacity="0"
            strokeLinecap="round"
          >
            <animate attributeName="opacity" values="0;1;0" dur="1s" begin="2s" repeatCount="indefinite" />
          </path>
        </g>

        {/* CryptaMail text */}
        <text
          x="60"
          y="100"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fontWeight="500"
          fill="#E5E7EB"
          opacity="0.8"
        >
          CryptaMail
        </text>
      </svg>


      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes flow-in {
          0% { 
            transform: translateX(-30px) scale(0); 
            opacity: 0; 
          }
          50% { 
            transform: translateX(0px) scale(1); 
            opacity: 0.8; 
          }
          100% { 
            transform: translateX(30px) scale(0.5); 
            opacity: 0; 
          }
        }
        
        @keyframes lock-brief {
          0%, 70%, 100% { opacity: 0; }
          80%, 90% { opacity: 1; }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-rotate {
          animation: rotate 4s linear infinite;
        }
        
        .animate-flow-in {
          animation: flow-in 3s ease-in-out infinite;
        }
        
        .animate-lock-brief {
          animation: lock-brief 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}