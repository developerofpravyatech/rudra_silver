import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings,
  BookOpen,
  Package,
  List,
  Layers,
  Tags,
  Contact,
  Coins,
  Receipt,
  ShoppingBag,
  UserPlus,
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
  const navigate = useNavigate();

  const tabToPath: Record<string, string> = {
    dashboard: '/',
    'user-management': '/users',
    'new-billing': '/billing/new',
    'silver-weighing': '/silver-weighing',
    'item-master': '/item-master',
    karigar: '/karigar',
    'category-list': '/categories',
    customers: '/customers',
    'silver-rate': '/silver-rate',
    'stock-list': '/stock-list',
    'metal-stock': '/metal-stock',
    inventory: '/inventory',
    'stock-status': '/stock-status',
    'daily-balance': '/daily-balance',
    transactions: '/transactions',
    'silver-bullion': '/silver-bullion',
    'purchase-register': '/purchase-register',
    'sale-register': '/sale-register',
    'customer-profit-report': '/customer-profit-report',
    'age-wise-list': '/age-wise-list',
    'party-ledgers': '/party-ledgers',
    'invoice-history': '/invoice-history',
    reports: '/reports',
    'scale-connection': '/scale-connection',
    settings: '/settings',
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'new-billing', label: 'New Billing', icon: FilePlus2, badge: 'New', },
    { id: 'category-list', label: 'Categories', icon: Tags },
    { id: 'customers', label: 'Customers', icon: Contact },
    { id: 'stock-list', label: 'Stock List', icon: Package },
    { id: 'metal-stock', label: 'Metal Stock', icon: Layers },
    { id: 'daily-balance', label: 'Daily Balance', icon: Scale },
    { id: 'transactions', label: 'Dailys Transaction', icon: List },
    { id: 'silver-bullion', label: 'Silver Bullion', icon: Coins },
    { id: 'purchase-register', label: 'Purchase Register', icon: Receipt },
    { id: 'sale-register', label: 'Sale Register', icon: ShoppingBag },
    { id: 'customer-profit-report', label: 'Customer Profit', icon: BarChart3 },
    { id: 'age-wise-list', label: 'Age Wise List', icon: Clock },
    { id: 'item-master', label: 'Item Master', icon: Sparkles },
    { id: 'karigar', label: 'Karigar', icon: UserPlus },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'party-ledgers', label: 'Ledgers', icon: BookOpen },
    { id: 'invoice-history', label: 'Invoice History', icon: Clock },
    { id: 'user-management', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-white dark:bg-[#0a0d13] border-r border-slate-200 dark:border-white/[0.07] flex flex-col justify-between h-full sticky top-0 select-none shrink-0 overflow-y-auto transition-colors duration-200">
      {/* Navigation Links */}
      <div className="px-3 pt-6 pb-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'stock-list' && (activeTab === 'stock-add' || activeTab === 'stock-edit')) ||
            (item.id === 'metal-stock' && (activeTab === 'metal-stock-add' || activeTab === 'metal-stock-edit')) ||
            (item.id === 'daily-balance' && (activeTab === 'daily-balance-add' || activeTab === 'daily-balance-edit')) ||
            (item.id === 'item-master' && (activeTab === 'item-add' || activeTab === 'item-edit')) ||
            (item.id === 'silver-bullion' && (activeTab === 'silver-bullion' || activeTab === 'silver-bullion-add' || activeTab === 'silver-bullion-edit')) ||
            (item.id === 'purchase-register' && (activeTab === 'purchase-register' || activeTab === 'purchase-register-add' || activeTab === 'purchase-register-edit')) ||
            (item.id === 'sale-register' && (activeTab === 'sale-register' || activeTab === 'sale-register-add' || activeTab === 'sale-register-edit')) ||
            (item.id === 'category-list' && (activeTab === 'category-list' || activeTab === 'category-add' || activeTab === 'category-edit')) ||
            (item.id === 'karigar' && (activeTab === 'karigar' || activeTab === 'karigar-add' || activeTab === 'karigar-edit')) ||
            (item.id === 'customers' && (activeTab === 'customers' || activeTab === 'customer-add' || activeTab === 'customer-edit'));
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                const path = tabToPath[item.id];
                if (path) navigate(path);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative ${isActive
                ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-300 shadow-xs dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60 dark:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
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
