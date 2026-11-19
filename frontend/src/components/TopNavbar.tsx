import React, { useState, useRef, useEffect } from 'react';
import { Home, FileText, Box, BarChart3, Settings, Sun, Moon, ChevronDown, Scale } from 'lucide-react';
import { DailyRates } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TopNavbarProps {
  activeTopTab: string;
  setActiveTopTab: (tab: string) => void;
  rates: DailyRates | null;
  liveWeight: number;
  isScaleConnected: boolean;
  onConnectScale: () => void;
  onOpenNewBilling: () => void;
  onOpenLedger: () => void;
  onOpenDailyEntry: () => void;
  onOpenCatalogue: () => void;
  onOpenRateModal: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTopTab,
  setActiveTopTab,
  rates,
  liveWeight,
  isScaleConnected,
  onConnectScale,
  onOpenNewBilling,
  onOpenLedger,
  onOpenDailyEntry,
  onOpenCatalogue,
  onOpenRateModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = (typeof window !== 'undefined' && (localStorage.getItem('rudra_user_name') || localStorage.getItem('username'))) || 'Admin';

  const topNavTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, action: () => setActiveTopTab('dashboard') },
    { id: 'billing', label: 'Billing', icon: FileText, action: onOpenNewBilling },
    { id: 'inventory', label: 'Inventory', icon: Box, action: onOpenCatalogue },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => setActiveTopTab('settings') },
  ];

  return (
    <header className="h-auto min-h-16 bg-white/95 dark:bg-[#0b0e14]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] px-6 py-2 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
      {/* Left: Brand Identity */}
      <div
        className="flex items-center space-x-3.5 cursor-pointer group"
        onClick={() => setActiveTopTab('dashboard')}
      >
        {theme === 'dark' ? (
          <img
            src="/assets/rudra-silver-logo-dark.svg"
            alt="Rudra Silver"
            className="h-10 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.35)] transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="bg-white rounded-lg p-1">
            <img
              src="/assets/logo-DZMSTiGP.svg"
              alt="Rudra Silver"
              className="h-10 w-auto"
            />
          </div>
        )}

      </div>

      {/* Center: Main Navigation Tabs */}
      <nav className="flex items-center bg-slate-100 dark:bg-[#131720] p-1 rounded-xl border border-slate-200 dark:border-white/[0.07] shadow-inner space-x-1">
        {topNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTopTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTopTab(tab.id);
                if (tab.action) tab.action();
              }}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${isActive
                      ? 'bg-white text-amber-700 font-semibold border border-amber-300 shadow-sm dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60 dark:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]'
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-amber-500 dark:via-amber-400 to-transparent rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Scale, Theme Toggle & Profile */}
      <div className="flex items-center space-x-3.5">
        {/* Scale Integration Quick Button */}
        <button
          onClick={onConnectScale}
          className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${isScaleConnected
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300 shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-700 dark:bg-[#141822] dark:border-white/[0.08] dark:text-slate-300 dark:hover:border-amber-500/30 dark:hover:text-amber-300'
            }`}
          title="Connect RS-232 / USB Digital Weighing Scale"
        >
          <Scale className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>{isScaleConnected ? `${liveWeight.toFixed(2)} g` : 'Connect Scale'}</span>
        </button>

        {/* Daily Entry Shortcut */}
        <button
          onClick={onOpenDailyEntry}
          className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-400 dark:bg-[#141822] dark:border-white/[0.08] dark:text-slate-300 dark:hover:text-amber-300 dark:hover:border-amber-500/30 text-xs transition"
          title="Open Classical Jwelly Daily Entry Hub"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></span>
          <span>Daily Entry</span>
        </button>

        {/* Theme Toggle Button (Replaces Notification Button) */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`relative p-2 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${theme === 'dark'
            ? 'bg-[#141822] border-white/[0.1] text-amber-300 hover:border-amber-400/50 hover:bg-[#1a202c] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
            : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm'
            }`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-amber-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Admin Profile Pill + Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-white/[0.08] cursor-pointer group"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 text-[#0b0e14] font-bold flex items-center justify-center text-xs shadow-md group-hover:ring-2 group-hover:ring-amber-400/40 transition">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Rudra Silver
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </div>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141822] shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  setActiveTopTab('settings');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  try {
                    localStorage.removeItem('rudra_user_name');
                    localStorage.removeItem('username');
                  } catch (e) { }
                  window.location.reload();
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
