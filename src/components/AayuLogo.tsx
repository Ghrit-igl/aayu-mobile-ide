/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official AAYU Brand Logo (Intent-to-Silicon) - Ultra HD Vector
 * 
 * Conceptual Anatomy:
 * - The letter 'A' is the bridge between Human Intelligence and Silicon Processing.
 * - LEFT HALF (Intent / White): Human cerebral cortex structure, organic looped brain gyri & sulci.
 * - RIGHT HALF (Silicon / Red): Computer brain / CPU circuitry, silicon wafer micro-traces & solder pads.
 * - Outer Silhouette: Metallic beveled contour on obsidian black ground.
 */

import React from 'react';

interface AayuLogoProps {
  className?: string;
  size?: number;
}

export const AayuLogo: React.FC<AayuLogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="AAYU Intent to Silicon Logo"
    >
      <defs>
        {/* Athletic letter 'A' geometric contour with flat top cap */}
        <clipPath id="aayu-letter-a-geom">
          <path
            d="
              M 35 11
              L 65 11
              L 95 89
              L 69 89
              L 62 70
              L 38 70
              L 31 89
              L 5 89
              Z
              M 44 55
              L 56 55
              L 50 34
              Z
            "
            clipRule="evenodd"
          />
        </clipPath>

        {/* Left half: Human Brain Intent */}
        <clipPath id="aayu-brain-clip">
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>

        {/* Right half: Computer Silicon Brain */}
        <clipPath id="aayu-silicon-clip">
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>

        {/* Metallic silver-white border gradient */}
        <linearGradient id="silver-bevel" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Glowing silicon crimson red gradient */}
        <linearGradient id="silicon-crimson" x1="50" y1="15" x2="95" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff3333" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
      </defs>

      {/* Solid Black Icon Background Tile */}
      <rect width="100" height="100" rx="16" fill="#000000" />

      {/* Outer Border Stroke of Letter A */}
      <path
        d="
          M 35 11
          L 65 11
          L 95 89
          L 69 89
          L 62 70
          L 38 70
          L 31 89
          L 5 89
          Z
          M 44 55
          L 56 55
          L 50 34
          Z
        "
        fill="#07070a"
        stroke="url(#silver-bevel)"
        strokeWidth="4.2"
        strokeLinejoin="miter"
      />

      {/* Interior Visual Artwork */}
      <g clipPath="url(#aayu-letter-a-geom)">
        {/* =========================================================
            LEFT HALF: HUMAN BRAIN (ORGANIC WHITE GYRI & LOOPS)
            ========================================================= */}
        <g clipPath="url(#aayu-brain-clip)">
          <rect x="0" y="0" width="50" height="100" fill="#08090d" />

          {/* Cerebral cortex loops & fold convolutions (Human Brain) */}
          {/* Main serpentine cortex loop 1 */}
          <path
            d="
              M 37 13
              C 43 14, 47 18, 43 23
              C 39 27, 44 32, 47 31
              C 50 30, 48 37, 42 38
              C 36 39, 41 45, 46 46
              C 50 47, 48 54, 42 55
              C 36 56, 40 62, 46 63
              C 50 64, 47 71, 41 72
              C 35 73, 38 79, 44 80
              C 48 81, 46 87, 39 88
              C 33 89, 34 89, 29 89
            "
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Outer sulci loops (Cerebral lobes) */}
          <path
            d="
              M 34 14
              C 27 18, 32 25, 26 28
              C 20 31, 26 38, 20 41
              C 14 44, 19 51, 14 55
              C 9 58, 14 65, 9 69
              C 4 73, 9 80, 6 85
              L 6 89
            "
            fill="none"
            stroke="#f8fafc"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interlocking internal brain fold loops */}
          <path
            d="
              M 35 21 C 28 23, 30 30, 36 31
              M 32 35 C 26 37, 28 44, 34 45
              M 28 49 C 22 51, 24 58, 30 59
              M 24 63 C 18 65, 20 72, 26 73
              M 20 77 C 14 79, 16 86, 22 87
            "
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Crossbar brain loop connection */}
          <path
            d="M 38 62 C 43 62, 45 66, 50 66"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </g>

        {/* =========================================================
            RIGHT HALF: SILICON COMPUTER BRAIN (RED CIRCUIT TRACES & NODES)
            ========================================================= */}
        <g clipPath="url(#aayu-silicon-clip)">
          <rect x="50" y="0" width="50" height="100" fill="#140306" />

          {/* Geometric 45° & 90° silicon wafer bus traces */}
          <g stroke="url(#silicon-crimson)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="miter" fill="none">
            {/* Top busline from center into silicon leg */}
            <path d="M 50 16 L 57 23 L 57 33 L 65 41 L 65 52" />
            <path d="M 50 25 L 61 36 L 70 36 L 74 40 L 74 57" />
            <path d="M 50 37 L 58 37 L 63 42 L 71 42 L 77 48 L 77 66" />

            {/* Crossbar silicon link */}
            <path d="M 50 63 L 58 63 L 62 59 L 69 59" />

            {/* Lower leg silicon branching */}
            <path d="M 58 63 L 64 69 L 64 79 L 71 86" />
            <path d="M 65 52 L 73 60 L 73 73 L 81 81 L 81 89" />
            <path d="M 74 57 L 80 63 L 86 63 L 89 66 L 89 89" />

            {/* Interconnecting data channels */}
            <path d="M 57 29 L 63 29" />
            <path d="M 69 46 L 74 46" />
            <path d="M 73 68 L 78 68" />
          </g>

          {/* Silicon solder pads / microvia nodes (Red circular points) */}
          <g fill="#ff1a1a">
            <circle cx="57" cy="23" r="2.3" />
            <circle cx="65" cy="41" r="2.5" />
            <circle cx="65" cy="52" r="2.6" />
            <circle cx="61" cy="36" r="2" />
            <circle cx="74" cy="40" r="2.4" />
            <circle cx="74" cy="57" r="2.8" />
            <circle cx="77" cy="48" r="2.5" />
            <circle cx="77" cy="66" r="3" />
            <circle cx="69" cy="59" r="2.2" />
            <circle cx="71" cy="86" r="2.6" />
            <circle cx="81" cy="81" r="2.8" />
            <circle cx="81" cy="89" r="2.4" />
            <circle cx="89" cy="66" r="2.5" />
            <circle cx="89" cy="87" r="2.7" />
            <circle cx="63" cy="29" r="1.9" />
            <circle cx="78" cy="68" r="2" />
          </g>
        </g>

        {/* Center meridian separating Human Brain and Silicon Brain */}
        <line x1="50" y1="11" x2="50" y2="89" stroke="#ffffff" strokeWidth="1.4" opacity="0.7" />

        {/* Inner triangular cutout with beveled border */}
        <path
          d="M 44 55 L 56 55 L 50 34 Z"
          fill="#000000"
          stroke="url(#silver-bevel)"
          strokeWidth="3.4"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
};
