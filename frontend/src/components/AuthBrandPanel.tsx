import React from 'react';

export const AuthBrandPanel: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col items-center justify-between bg-[#080a0f] p-10 border-r border-amber-500/15 relative overflow-hidden select-none">
      {/* Background silk and light effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#06080b] via-[#0d1017] to-[#050608] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-600/10 blur-[90px] pointer-events-none" />


      {/* Centerpiece Luxury Jewellery Illustration */}
      <div className="relative z-10 my-auto py-6 flex items-center justify-center">
        <div className="relative w-64 h-52 flex items-center justify-center">
          {/* Subtle glow behind jewellery */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/15 via-amber-400/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Luxury Jewellery Image */}
          <img
            src="/assets/rudra-silver-logo-dark.svg"
            alt="Rudra Silver Jewellery"
            className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
            loading="lazy"
          />
        </div>
      </div>

      {/* Brand Footer */}
      <div className="relative z-10 text-center text-[10px] text-slate-500 font-sans tracking-wide">
        &copy; 2026 Rudra Silver. All rights reserved.
      </div>
    </div>
  );
};
