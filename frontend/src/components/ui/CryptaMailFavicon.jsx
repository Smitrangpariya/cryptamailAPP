import React from 'react';

export default function CryptaMailFavicon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Simple envelope with lock */}
      <rect
        x="4"
        y="10"
        width="24"
        height="14"
        rx="2"
        fill="none"
        stroke="url(#faviconGradient)"
        strokeWidth="1.5"
      />
      
      {/* Envelope flap */}
      <path
        d="M4 12 L16 18 L28 12"
        fill="none"
        stroke="url(#faviconGradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Lock icon */}
      <g transform="translate(16, 17)">
        <rect
          x="-2"
          y="-0.5"
          width="4"
          height="3"
          rx="0.5"
          fill="url(#faviconGradient)"
        />
        <path
          d="M-1.5,-0.5 A1.5,1.5 0 0,1 1.5,-0.5"
          fill="none"
          stroke="url(#faviconGradient)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}