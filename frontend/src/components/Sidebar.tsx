import React from 'react';
import {
  Home,
  FilePlus2,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
  Box,
  Clock,
  BarChart3,
  Wifi,
  Printer,
  ShieldCheck,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewBilling?: () => void;
  onOpenLedger?: () => void;
  onOpenWeighingModal?: () => void;
  onOpenRateModal?: () => void;
  onOpenCatalogue?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    {
      id: 'new-billing',
      label: 'New Billing',
      icon: FilePlus2,
      badge: 'New',
    },
    {
      id: 'silver-weighing',
      label: 'Silver Weighing',
      icon: Scale,
    },
    { id: 'item-master', label: 'Item Master', icon: Sparkles },
    { id: 'silver-rate', label: 'Silver Rate', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'invoice-history', label: 'Invoice History', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    {
      id: 'scale-connection',
      label: 'Scale Connection',
      icon: Wifi,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-white dark:bg-[#0a0d13] border-r border-slate-200 dark:border-white/[0.07] flex flex-col justify-between h-full sticky top-0 select-none shrink-0 overflow-y-auto transition-colors duration-200">
      {/* Navigation Links */}
      <div className="px-3 pt-6 pb-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative ${isActive
                ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-300 shadow-sm dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60 dark:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${isActive
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400 group-hover:text-amber-600 dark:text-slate-400 dark:group-hover:text-amber-300'
                    }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-[#0b0e14] shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Luxury Signature Branding */}
      <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] bg-gradient-to-t from-slate-50 to-transparent dark:from-[#0e121a] dark:to-transparent relative overflow-hidden transition-colors duration-200">
        <div className="relative z-10">
          <div className="font-script text-2xl text-amber-700 dark:text-amber-300/90 tracking-wide font-normal">
            Rudra Silver
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-serif italic tracking-wider -mt-1 pl-1">
            Shine Forever...
          </div>
        </div>

        {/* Silver decorative curved metallic wave */}
        <svg
          viewBox="0 0 200 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -bottom-2 -right-2 w-48 opacity-40 pointer-events-none"
        >
          <path
            d="M0 35C40 35 60 5 100 15C140 25 160 5 200 20"
            stroke="url(#silverGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M10 38C50 38 70 12 110 20C150 28 170 10 210 25"
            stroke="url(#silverGradient)"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <defs>
            <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#cbd5e1" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </aside>
  );
};
