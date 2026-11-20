import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar } from './components/Sidebar';
import { MainDashboard } from './components/MainDashboard';
import { PosBillingModal } from './components/PosBillingModal';
import { AccountLedgerModal } from './components/AccountLedgerModal';
import { StockStatusPage } from './components/StockStatusPage';
import { DailyBalancePage } from './components/DailyBalancePage';
import { TransactionPage } from './components/TransactionPage';
import { SilverWeighingModal } from './components/SilverWeighingModal';
import { SilverRateModal } from './components/SilverRateModal';
import { CategoryItemsModal } from './components/CategoryItemsModal';
import { InventoryPage } from './components/InventoryPage';
import { InvoiceHistoryPage } from './components/InvoiceHistoryPage';
import { ReportsPage } from './components/ReportsPage';
import { ScaleConnectionPage } from './components/ScaleConnectionPage';
import { PrinterSettingsPage } from './components/PrinterSettingsPage';
import { UserManagementPage } from './components/UserManagementPage';
import { SettingsPage } from './components/SettingsPage';
import { useWeighingScale } from './hooks/useWeighingScale';
import { fetchTodayRates, fetchDailySummary } from './services/api';
import { DailyRates, DailySummary, BillingItem, AuthUser } from './types';
import { Loader2 } from 'lucide-react';

interface MainAppProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();
  const [rates, setRates] = useState<DailyRates | null>(null);
  const [summary, setSummary] = useState<DailySummary>({
    date: '2026-11-17',
    opening_cash: 252400,
    closing_cash: 252400,
    voucher_counts: {
      receipt: 0,
      payment: 0,
      sale: 0,
      purchase: 0,
      sale_return: 0,
      purchase_return: 0,
      journal: 0,
      contra: 0,
      issue: 0,
      receive: 0,
      order: 0,
      repair: 0,
    },
  });

  const [activeTopTab, setActiveTopTab] = useState<string>('dashboard');
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>('dashboard');

  const pathToTab: Record<string, string> = {
    '/': 'dashboard',
    '/users': 'user-management',
    '/billing/new': 'new-billing',
    '/silver-weighing': 'silver-weighing',
    '/item-master': 'item-master',
    '/silver-rate': 'silver-rate',
    '/inventory': 'inventory',
    '/stock-status': 'stock-status',
    '/daily-balance': 'daily-balance',
    '/transactions': 'transactions',
    '/party-ledgers': 'party-ledgers',
    '/invoice-history': 'invoice-history',
    '/reports': 'reports',
    '/scale-connection': 'scale-connection',
    '/settings': 'settings',
  };

  useEffect(() => {
    const tab = pathToTab[location.pathname] || 'dashboard';
    setActiveSidebarTab(tab);
    setActiveTopTab(tab === 'dashboard' ? 'dashboard' : tab);
  }, [location.pathname]);
  const [activeVoucherType, setActiveVoucherType] = useState<string>('SALE');
  const [preloadedBillingItem, setPreloadedBillingItem] = useState<Partial<BillingItem> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { liveWeight, isConnected, connectScale } = useWeighingScale();

  useEffect(() => {
    fetchTodayRates().then(setRates);
    fetchDailySummary().then(setSummary);
  }, []);

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    'new-billing': 'Billing',
    'silver-weighing': 'Silver Weighing',
    'item-master': 'Item Master',
    'silver-rate': 'Silver Rate',
    customers: 'Customers',
    inventory: 'Inventory',
    'stock-status': 'Stock Status',
    'daily-balance': 'Daily Balance',
    'transactions': 'Transaction',
    'party-ledgers': 'Party Ledgers',
    'invoice-history': 'Invoice History',
    reports: 'Reports',
    'scale-connection': 'Scale Connection',
    'printer-settings': 'Printer Settings',
    'user-management': 'User Management',
    settings: 'Settings',
  };

  useEffect(() => {
    const name = pageTitles[activeSidebarTab];
    document.title = name ? `${name} | Rudra Silver` : 'Rudra Silver';
  }, [activeSidebarTab]);

  const handleOpenBilling = (type: string = 'SALE', item?: Partial<BillingItem>) => {
    setActiveVoucherType(type);
    setPreloadedBillingItem(item || null);
    setActiveSidebarTab('new-billing');
    setActiveTopTab('billing');
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setActiveSidebarTab('inventory');
    setActiveTopTab('inventory');
  };

  const renderMainContent = () => {
    switch (activeSidebarTab) {
      case 'dashboard':
        return (
          <MainDashboard
            rates={rates}
            onOpenNewBilling={() => handleOpenBilling('SALE')}
            onOpenLedger={() => {
              setActiveSidebarTab('customers');
              setActiveTopTab('reports');
            }}
            onOpenWeighingModal={() => setActiveSidebarTab('silver-weighing')}
            onOpenRateModal={() => setActiveSidebarTab('silver-rate')}
            onSelectCategory={handleSelectCategory}
          />
        );

      case 'new-billing':
        return (
          <PosBillingModal
            voucherType={activeVoucherType}
            rates={rates}
            liveWeight={liveWeight}
            initialItem={preloadedBillingItem}
            onClose={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
              setPreloadedBillingItem(null);
            }}
            isInline={true}
          />
        );

      case 'silver-weighing':
        return (
          <SilverWeighingModal
            liveWeight={liveWeight}
            isScaleConnected={isConnected}
            onConnectScale={connectScale}
            rates={rates}
            onSendToBilling={(weight, description, touch) => {
              handleOpenBilling('SALE', {
                grossWeight: weight,
                description,
                purityTouch: touch,
              });
            }}
            onClose={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
            isInline={true}
          />
        );

      case 'item-master':
        return (
          <CategoryItemsModal
            categoryName={selectedCategory || 'Payal'}
            onSelectProduct={(productName, defaultPurity, approxGrossWt) => {
              handleOpenBilling('SALE', {
                description: productName,
                purityTouch: defaultPurity,
                grossWeight: approxGrossWt,
              });
            }}
            onClose={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
            isInline={true}
          />
        );

      case 'silver-rate':
        return (
          <SilverRateModal
            rates={rates}
            onClose={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
            isInline={true}
          />
        );

      case 'customers':
        return (
          <AccountLedgerModal
            onClose={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
            isInline={true}
          />
        );

      case 'inventory':
        return (
          <InventoryPage
            initialCategory={selectedCategory}
            onSelectForBilling={(item) => handleOpenBilling('SALE', item)}
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'party-ledgers':
        return (
          <AccountLedgerModal
            onClose={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
            isInline={true}
          />
        );

      case 'stock-status':
        return (
          <StockStatusPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'stock-status':
        return (
          <StockStatusPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'daily-balance':
        return (
          <DailyBalancePage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'transactions':
        return (
          <TransactionPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'invoice-history':
        return (
          <InvoiceHistoryPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'reports':
        return (
          <ReportsPage
            summary={summary}
            onOpenVoucher={(type) => handleOpenBilling(type)}
            onOpenLedger={() => {
              setActiveSidebarTab('customers');
              setActiveTopTab('reports');
            }}
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'scale-connection':
        return (
          <ScaleConnectionPage
            liveWeight={liveWeight}
            isScaleConnected={isConnected}
            onConnectScale={connectScale}
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'printer-settings':
        return (
          <PrinterSettingsPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'user-management':
        return (
          <UserManagementPage
            currentUser={currentUser}
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      case 'settings':
        return (
          <SettingsPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
            }}
          />
        );

      default:
        return (
          <MainDashboard
            rates={rates}
            onOpenNewBilling={() => handleOpenBilling('SALE')}
            onOpenLedger={() => {
              setActiveSidebarTab('customers');
              setActiveTopTab('reports');
            }}
            onOpenWeighingModal={() => setActiveSidebarTab('silver-weighing')}
            onOpenRateModal={() => setActiveSidebarTab('silver-rate')}
            onSelectCategory={handleSelectCategory}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none antialiased transition-colors duration-150">
      {/* 1. Common Top Navbar (Always visible across all pages) */}
      <TopNavbar
        activeTopTab={activeTopTab}
        setActiveTopTab={(tab) => {
          setActiveTopTab(tab);
          if (tab === 'dashboard') setActiveSidebarTab('dashboard');
          if (tab === 'billing') handleOpenBilling('SALE');
          if (tab === 'inventory') setActiveSidebarTab('inventory');
          if (tab === 'reports') setActiveSidebarTab('reports');
          if (tab === 'settings') setActiveSidebarTab('settings');
        }}
        rates={rates}
        liveWeight={liveWeight}
        isScaleConnected={isConnected}
        onConnectScale={connectScale}
        onOpenNewBilling={() => handleOpenBilling('SALE')}
        onOpenLedger={() => {
          setActiveSidebarTab('customers');
          setActiveTopTab('reports');
        }}
        onOpenDailyEntry={() => {
          setActiveSidebarTab('reports');
          setActiveTopTab('reports');
        }}
        onOpenCatalogue={() => {
          setSelectedCategory('Payal');
          setActiveSidebarTab('inventory');
          setActiveTopTab('inventory');
        }}
        onOpenRateModal={() => setActiveSidebarTab('silver-rate')}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenSettings={() => {
          setActiveSidebarTab('settings');
          setActiveTopTab('settings');
        }}
      />

      {/* 2. Main Body with Left Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Common Left Vertical Sidebar (Always visible across all pages) */}
        <Sidebar
          activeTab={activeSidebarTab}
          setActiveTab={(tab) => {
            setActiveSidebarTab(tab);
            if (tab === 'dashboard') setActiveTopTab('dashboard');
            else if (tab === 'new-billing') setActiveTopTab('billing');
            else if (tab === 'inventory' || tab === 'item-master') setActiveTopTab('inventory');
            else if (tab === 'reports' || tab === 'customers' || tab === 'invoice-history') setActiveTopTab('reports');
            else if (tab === 'settings' || tab === 'printer-settings' || tab === 'user-management' || tab === 'scale-connection') setActiveTopTab('settings');
          }}
        />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#f4f6f9] dark:bg-[#080a0d] transition-colors duration-150">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password'>('login');

  useEffect(() => {
    if (isLoading) {
      document.title = 'Rudra Silver';
    } else if (!isAuthenticated) {
      const name = authView === 'register' ? 'Register' : authView === 'forgot-password' ? 'Forgot Password' : 'Login';
      document.title = `${name} | Rudra Silver`;
    }
  }, [isLoading, isAuthenticated, authView]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080a0d] flex flex-col items-center justify-center gap-4 text-center select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-xs">
            RS
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-200 tracking-widest uppercase">
            RUDRA SILVER
          </h2>
          <p className="text-[11px] text-amber-500/70 font-mono">
            Verifying Authentication Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onGoLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPasswordPage onGoLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onGoRegister={() => setAuthView('register')}
        onGoForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  return <MainApp currentUser={user} onLogout={logout} />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
