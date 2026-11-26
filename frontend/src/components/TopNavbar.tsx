import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Box, Receipt, Settings, Sun, Moon, ChevronDown, Scale, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { DailyRates, AuthUser } from '../types';
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
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenSettings?: () => void;
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
  currentUser,
  onLogout,
  onOpenSettings,
}) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const tabToPath: Record<string, string> = {
    dashboard: '/',
    billing: '/billing/new',
    inventory: '/inventory',
    settings: '/settings',
  };

  const pathToTab: Record<string, string> = {
    '/': 'dashboard',
    '/billing/new': 'billing',
    '/inventory': 'inventory',
    '/settings': 'settings',
  };

  const activeTopTabResolved = pathToTab[location.pathname] || activeTopTab;
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

  const displayName = currentUser?.name || (typeof window !== 'undefined' && (localStorage.getItem('rudra_user_name') || localStorage.getItem('username'))) || 'Admin';
  const displayRole = currentUser?.role || 'ADMIN';

  const topNavTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, action: () => { setActiveTopTab('dashboard'); navigate('/'); } },
    { id: 'purchase-register', label: 'Purchase Register', icon: Receipt, action: () => { setActiveTopTab('purchase-register'); navigate('/purchase-register'); } },
    { id: 'billing', label: 'Billing', icon: FileText, action: () => { if (onOpenNewBilling) onOpenNewBilling(); navigate('/billing/new'); } },
    { id: 'inventory', label: 'Inventory', icon: Box, action: () => { if (onOpenCatalogue) onOpenCatalogue(); navigate('/inventory'); } },
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
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/', action: () => setActiveTopTab('dashboard') },
          { id: 'purchase-register', label: 'Purchase Register', icon: Receipt, path: '/purchase-register', action: () => setActiveTopTab('purchase-register') },
          { id: 'daily-balance', label: 'Daily Balance', icon: Scale, path: '/daily-balance', action: () => setActiveTopTab('daily-balance') },
          { id: 'stock', label: 'Stock', icon: Box, path: '/stock-list', action: () => setActiveTopTab('stock') },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || (tab.id === 'stock' && location.pathname.startsWith('/stock'));
          return (
            <button
              key={tab.id}
              onClick={() => { tab.action(); navigate(tab.path); }}
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

        {/* User Profile Pill + Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-white/[0.08] cursor-pointer group"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 text-[#0b0e14] font-bold flex items-center justify-center text-xs shadow-md group-hover:ring-2 group-hover:ring-amber-400/40 transition">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition leading-tight">
                {displayName}
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-semibold tracking-wider uppercase px-1 rounded ${displayRole === 'ADMIN'
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                  {displayRole}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </div>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141822] shadow-xl py-2 z-50 text-xs">
              {/* Profile Card Header */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                {currentUser?.mobile && (
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    +91 {currentUser.mobile}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    {displayRole === 'ADMIN' ? 'Full Administrator Access' : 'Staff Access'}
                  </span>
                </div>
              </div>

              {/* Settings Action */}
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onOpenSettings) onOpenSettings();
                  else setActiveTopTab('settings');
                }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Settings</span>
              </button>

              {/* Logout Action */}
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    localStorage.removeItem('rudra_auth_token');
                    window.location.reload();
                  }
                }}
                className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-white/[0.06] mt-1 pt-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

