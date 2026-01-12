import React from 'react';

export default function CryptaMailLogo({ width = 300, height = 300 }) {
  return (
    <div style={{ width, height }} className="relative">
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))'
        }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="cipherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          
          <radialGradient id="glowGradient">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background glow circle */}
        <circle
          cx="150"
          cy="150"
          r="120"
          fill="url(#glowGradient)"
          opacity="0.3"
          className="animate-pulse"
        />

        {/* Encrypted binary code background */}
        <g opacity="0.3" className="animate-pulse">
          <text x="30" y="50" fill="#06B6D4" fontSize="8" fontFamily="monospace">
            01001011 11010010
          </text>
          <text x="200" y="80" fill="#8B5CF6" fontSize="8" fontFamily="monospace">
            10110101 01101100
          </text>
          <text x="40" y="250" fill="#3B82F6" fontSize="8" fontFamily="monospace">
            00111011 10010101
          </text>
          <text x="180" y="270" fill="#06B6D4" fontSize="8" fontFamily="monospace">
            11001010 10110011
          </text>
        </g>

        {/* Encrypted symbols floating */}
        <g className="animate-float-slow">
          <circle cx="60" cy="80" r="3" fill="#8B5CF6" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="240" cy="100" r="2" fill="#06B6D4" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="80" cy="220" r="2.5" fill="#3B82F6" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="220" cy="200" r="2" fill="#8B5CF6" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.8s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Envelope shape */}
        <g className="animate-converge" filter="url(#glow)">
          {/* Envelope base */}
          <rect
            x="100"
            y="120"
            width="100"
            height="70"
            rx="8"
            fill="none"
            stroke="url(#cipherGradient)"
            strokeWidth="2"
            className="animate-draw"
          />
          
          {/* Envelope flap */}
          <path
            d="M100 125 L150 160 L200 125"
            fill="none"
            stroke="url(#cipherGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-draw-delayed"
          />
          
          {/* Center line */}
          <line
            x1="100"
            y1="175"
            x2="200"
            y2="175"
            stroke="url(#cipherGradient)"
            strokeWidth="1"
            opacity="0.5"
          />
        </g>

        {/* Lock icon */}
        <g className="animate-lock-appear" transform="translate(150, 150)">
          {/* Lock body */}
          <rect
            x="-8"
            y="-2"
            width="16"
            height="12"
            rx="2"
            fill="url(#cipherGradient)"
            opacity="0"
          >
            <animate attributeName="opacity" values="0;1" dur="0.5s" begin="2.5s" fill="freeze"/>
          </rect>
          
          {/* Lock shackle */}
          <path
            d="M-5,-2 A5,5 0 0,1 5,-2"
            fill="none"
            stroke="url(#cipherGradient)"
            strokeWidth="2"
            opacity="0"
            strokeLinecap="round"
          >
            <animate attributeName="opacity" values="0;1" dur="0.5s" begin="2.5s" fill="freeze"/>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 -5 0;-10 -5 0;-10 -5 0;0 -5 0"
              dur="0.5s"
              begin="3s"
              fill="freeze"
            />
          </path>
        </g>

        {/* Light particles */}
        <g className="animate-dissolve">
          {[...Array(12)].map((_, i) => (
            <circle
              key={i}
              cx={150 + Math.cos(i * 30 * Math.PI / 180) * 80}
              cy={150 + Math.sin(i * 30 * Math.PI / 180) * 80}
              r="1"
              fill="#06B6D4"
              opacity="0"
            >
              <animate 
                attributeName="opacity" 
                values="0;0.8;0" 
                dur="0.8s" 
                begin={`${3.2 + i * 0.1}s`} 
                fill="freeze"
              />
              <animate 
                attributeName="cy" 
                values={`${150 + Math.sin(i * 30 * Math.PI / 180) * 80};${150 + Math.sin(i * 30 * Math.PI / 180) * 100};${150 + Math.sin(i * 30 * Math.PI / 180) * 120}`} 
                dur="0.8s" 
                begin={`${3.2 + i * 0.1}s`} 
                fill="freeze"
              />
            </circle>
          ))}
        </g>

        {/* CryptaMail text */}
        <text
          x="150"
          y="220"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="24"
          fontWeight="600"
          fill="#E5E7EB"
          opacity="0"
          className="animate-fade-in-text"
        >
          CryptaMail
        </text>
      </svg>

    </div>
  );
}