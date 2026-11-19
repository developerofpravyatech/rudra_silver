import React from 'react';

export const LuxuryDiamondIcon: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="diamondGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#f3e5ab" />
        <stop offset="70%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#aa8218" />
      </linearGradient>
      <linearGradient id="facetShine" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
      </linearGradient>
    </defs>
    {/* Diamond Outline */}
    <path
      d="M14 6L6 18L24 42L42 18L34 6H14Z"
      stroke="url(#diamondGold)"
      strokeWidth="2.2"
      strokeLinejoin="round"
      fill="rgba(212, 175, 55, 0.05)"
    />
    {/* Upper facets */}
    <path d="M14 6L24 18M34 6L24 18" stroke="url(#diamondGold)" strokeWidth="1.6" />
    <path d="M6 18H42" stroke="url(#diamondGold)" strokeWidth="1.8" />
    {/* Lower facets converging to point */}
    <path d="M6 18L24 42L42 18" stroke="url(#diamondGold)" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M14 6H34" stroke="url(#diamondGold)" strokeWidth="2" />
    <path d="M14 18L24 42L34 18" stroke="url(#diamondGold)" strokeWidth="1.6" />
    {/* Crown facets */}
    <polygon points="14,6 24,18 18,18" fill="url(#facetShine)" />
    <polygon points="34,6 24,18 30,18" fill="url(#facetShine)" />
  </svg>
);
