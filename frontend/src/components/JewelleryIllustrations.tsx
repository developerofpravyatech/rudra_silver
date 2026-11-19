import React from 'react';

// Ornate Silver Payal / Ankle Bracelet with dangling bells
export const SilverPayalIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="silverGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#d1d5db" />
        <stop offset="70%" stopColor="#9ca3af" />
        <stop offset="100%" stopColor="#e5e7eb" />
      </linearGradient>
      <linearGradient id="silverGoldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <filter id="silverGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#94a3b8" floodOpacity="0.5" />
      </filter>
    </defs>
    {/* Payal Arch */}
    <path
      d="M15 45 Q 50 25 85 45 Q 50 32 15 45 Z"
      fill="url(#silverGrad1)"
      filter="url(#silverGlow)"
    />
    <path
      d="M18 47 Q 50 29 82 47"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeDasharray="2 1"
    />
    {/* Dangling Ghungroos (Bells) */}
    {[22, 32, 42, 52, 62, 72, 80].map((cx, i) => (
      <g key={i}>
        <line x1={cx} y1="44" x2={cx} y2="54" stroke="url(#silverGrad1)" strokeWidth="1.5" />
        <circle cx={cx} cy="56" r="3.2" fill="url(#silverGoldAccent)" filter="url(#silverGlow)" />
        <circle cx={cx - 0.8} cy="54.8" r="0.8" fill="#ffffff" />
      </g>
    ))}
    {/* Center Ornate Flower */}
    <circle cx="50" cy="38" r="4" fill="url(#silverGoldAccent)" />
    <circle cx="50" cy="38" r="1.5" fill="#f8fafc" />
  </svg>
);

// Interlocking Silver Chain
export const SilverChainIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="chainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>
    <path
      d="M20 30 C 35 65, 65 65, 80 30"
      stroke="url(#chainGrad)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20 30 C 35 65, 65 65, 80 30"
      stroke="#ffffff"
      strokeWidth="1"
      strokeDasharray="3 4"
      strokeLinecap="round"
      fill="none"
    />
    {/* Center Pendant */}
    <polygon points="50,68 44,57 56,57" fill="url(#chainGrad)" />
    <circle cx="50" cy="62" r="2" fill="#ffffff" />
  </svg>
);

// Solid Embossed Silver Kada (Bangle)
export const SilverKadaIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="kadaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="25%" stopColor="#e2e8f0" />
        <stop offset="60%" stopColor="#94a3b8" />
        <stop offset="85%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
    {/* Oval Kada */}
    <ellipse cx="50" cy="50" rx="34" ry="24" stroke="url(#kadaGrad)" strokeWidth="8" fill="none" />
    <ellipse cx="50" cy="50" rx="36" ry="26" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 2" fill="none" />
    <ellipse cx="50" cy="50" rx="32" ry="22" stroke="#64748b" strokeWidth="0.8" fill="none" />
    {/* Engraving Highlights */}
    <circle cx="28" cy="42" r="2.5" fill="#ffffff" opacity="0.8" />
    <circle cx="72" cy="58" r="2.5" fill="#ffffff" opacity="0.8" />
  </svg>
);

// Solitaire Diamond Ring in Silver
export const SilverRingIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="diamondSparkle" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>
    </defs>
    {/* Ring Band */}
    <ellipse cx="50" cy="58" rx="28" ry="18" stroke="url(#ringGrad)" strokeWidth="5" fill="none" />
    {/* Diamond Setting */}
    <path d="M42 35 L58 35 L50 46 Z" fill="url(#ringGrad)" />
    {/* Brilliant Solitaire Gem */}
    <polygon points="50,22 59,29 56,36 44,36 41,29" fill="url(#diamondSparkle)" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="41" y1="29" x2="59" y2="29" stroke="#93c5fd" strokeWidth="0.6" />
    <line x1="50" y1="22" x2="50" y2="36" stroke="#ffffff" strokeWidth="0.6" />
  </svg>
);

// Silver Bracelet
export const SilverBraceletIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="brcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="50" rx="32" ry="20" stroke="url(#brcGrad)" strokeWidth="5.5" fill="none" strokeDasharray="9 2" />
    {/* Hanging Heart Charm */}
    <path
      d="M50 72 C50 72, 44 65, 44 61 C44 58, 47 56, 50 59 C53 56, 56 58, 56 61 C56 65, 50 72, 50 72 Z"
      fill="url(#brcGrad)"
      stroke="#ffffff"
      strokeWidth="0.6"
    />
  </svg>
);

// Other Ornaments / Silver Pendant
export const SilverOtherIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="othGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>
    {/* Traditional Silver Thali / Plate */}
    <circle cx="50" cy="50" r="32" stroke="url(#othGrad)" strokeWidth="4" fill="none" />
    <circle cx="50" cy="50" r="26" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" fill="none" />
    {/* Diya / Kalash Center */}
    <ellipse cx="50" cy="50" rx="10" ry="6" fill="url(#othGrad)" />
    <circle cx="50" cy="46" r="3" fill="#ffffff" />
  </svg>
);

// Ornate Hero Banner Heavy Silver Payal (Exact match for the hero banner)
export const HeroSilverPayalIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 240 240" className={className} fill="none">
    <defs>
      <linearGradient id="heroSilver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="25%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="75%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="heroGoldTint" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <filter id="heroShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#94a3b8" floodOpacity="0.3" />
      </filter>
    </defs>
    
    <g filter="url(#heroShadow)">
      {/* Upper Band: 3 layers */}
      <path
        d="M30 110 Q 120 60 210 110 Q 120 80 30 110 Z"
        fill="url(#heroSilver)"
      />
      <path
        d="M32 113 Q 120 65 208 113"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeDasharray="4 3"
      />
      <path
        d="M35 125 Q 120 85 205 125 Q 120 100 35 125 Z"
        fill="url(#heroGoldTint)"
      />

      {/* Intricate Filigree Mesh */}
      {[50, 70, 90, 110, 130, 150, 170, 190].map((x, i) => (
        <circle key={i} cx={x} cy={110 - Math.sin((i / 7) * Math.PI) * 20} r="3" fill="#ffffff" />
      ))}

      {/* Hanging Chains and Heavy Bells */}
      {[45, 65, 85, 105, 125, 145, 165, 185, 195].map((cx, i) => {
        const archY = 125 - Math.sin((i / 8) * Math.PI) * 18;
        return (
          <g key={i}>
            <line x1={cx} y1={archY} x2={cx} y2={archY + 22} stroke="url(#heroSilver)" strokeWidth="2.5" />
            <circle cx={cx} cy={archY + 27} r="6" fill="url(#heroSilver)" />
            <circle cx={cx - 1.5} cy={archY + 25} r="2" fill="#ffffff" />
            {/* Tiny lower dangling bead */}
            <circle cx={cx} cy={archY + 36} r="2" fill="url(#heroGoldTint)" />
          </g>
        );
      })}
    </g>
  </svg>
);
