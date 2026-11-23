import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { StockListPage } from './components/stock/StockListPage';
import { StockAddPage } from './components/stock/StockAddPage';
import { StockEditPage } from './components/stock/StockEditPage';
import { MetalStockListPage } from './components/metalStock/MetalStockListPage';
import { MetalStockAddPage } from './components/metalStock/MetalStockAddPage';
import { MetalStockEditPage } from './components/metalStock/MetalStockEditPage';
import { DailyBalanceListPage } from './components/dailyBalance/DailyBalanceListPage';
import { DailyBalanceAddPage } from './components/dailyBalance/DailyBalanceAddPage';
import { DailyBalanceEditPage } from './components/dailyBalance/DailyBalanceEditPage';
import { DailyBalancePage } from './components/DailyBalancePage';
import { ItemListPage } from './components/items/ItemListPage';
import { ItemAddPage } from './components/items/ItemAddPage';
import { ItemEditPage } from './components/items/ItemEditPage';
import { CategoryListPage } from './components/categories/CategoryListPage';
import { CategoryAddPage } from './components/categories/CategoryAddPage';
import { CategoryEditPage } from './components/categories/CategoryEditPage';
import { CustomerListPage } from './components/customers/CustomerListPage';
import { CustomerAddPage } from './components/customers/CustomerAddPage';
import { CustomerEditPage } from './components/customers/CustomerEditPage';
import { TransactionPage } from './components/TransactionPage';
import { SilverWeighingModal } from './components/SilverWeighingModal';
import { SilverRateModal } from './components/SilverRateModal';
import { CategoryItemsModal } from './components/CategoryItemsModal';
import { ItemModuleContainer } from './components/ItemModuleContainer';
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
  const navigate = useNavigate();
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
    '/items': 'item-master',
    '/item-master': 'item-master',
    '/items/add': 'item-add',
    '/categories': 'category-list',
    '/category-list': 'category-list',
    '/categories/add': 'category-add',
    '/customers': 'customers',
    '/customers/add': 'customer-add',
    '/silver-rate': 'silver-rate',
    '/inventory': 'inventory',
    '/stock': 'stock-list',
    '/stock-list': 'stock-list',
    '/stock/add': 'stock-add',
    '/metal-stock': 'metal-stock',
    '/metal-stock-list': 'metal-stock',
    '/metal-stock/add': 'metal-stock-add',
    '/stock-status': 'stock-status',
    '/daily-balance': 'daily-balance',
    '/daily-balance/add': 'daily-balance-add',
    '/transactions': 'transactions',
    '/party-ledgers': 'party-ledgers',
    '/invoice-history': 'invoice-history',
    '/reports': 'reports',
    '/scale-connection': 'scale-connection',
    '/settings': 'settings',
  };

  useEffect(() => {
    let tab = pathToTab[location.pathname];
    if (!tab) {
      if (location.pathname.startsWith('/stock/edit/')) {
        tab = 'stock-edit';
      } else if (location.pathname === '/stock/add') {
        tab = 'stock-add';
      } else if (location.pathname.startsWith('/metal-stock/edit/')) {
        tab = 'metal-stock-edit';
      } else if (location.pathname === '/metal-stock/add') {
        tab = 'metal-stock-add';
      } else if (location.pathname.startsWith('/daily-balance/edit/')) {
        tab = 'daily-balance-edit';
      } else if (location.pathname === '/daily-balance/add') {
        tab = 'daily-balance-add';
      } else if (location.pathname.startsWith('/items/edit/')) {
        tab = 'item-edit';
      } else if (location.pathname === '/items/add') {
        tab = 'item-add';
      } else if (location.pathname.startsWith('/categories/edit/')) {
        tab = 'category-edit';
      } else if (location.pathname === '/categories/add') {
        tab = 'category-add';
      } else if (location.pathname === '/categories' || location.pathname === '/category-list') {
        tab = 'category-list';
      } else if (location.pathname.startsWith('/customers/edit/')) {
        tab = 'customer-edit';
      } else if (location.pathname === '/customers/add') {
        tab = 'customer-add';
      } else if (location.pathname === '/customers') {
        tab = 'customers';
      } else {
        tab = 'dashboard';
      }
    }
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
    'item-master': 'Item List',
    'item-add': 'Add Item',
    'item-edit': 'Edit Item',
    'category-list': 'Category List',
    'category-add': 'Add Category',
    'category-edit': 'Edit Category',
    'silver-rate': 'Silver Rate',
    customers: 'Customers',
    inventory: 'Inventory',
    'stock-list': 'Stock List',
    'stock-add': 'Add Stock',
    'stock-edit': 'Edit Stock',
    'metal-stock': 'Metal Stock',
    'metal-stock-add': 'Add Metal Stock',
    'metal-stock-edit': 'Edit Metal Stock',
    'stock-status': 'Stock Status',
    'daily-balance': 'Daily Balance',
    'daily-balance-add': 'Add Daily Balance',
    'daily-balance-edit': 'Edit Daily Balance',
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
          <ItemListPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
              navigate('/');
            }}
            onNavigateAdd={() => {
              setActiveSidebarTab('item-add');
              navigate('/items/add');
            }}
            onNavigateEdit={(id) => {
              setActiveSidebarTab('item-edit');
              navigate(`/items/edit/${id}`);
            }}
          />
        );

      case 'item-add':
        return (
          <ItemAddPage
            onBackToList={() => {
              setActiveSidebarTab('item-master');
              setActiveTopTab('item-master');
              navigate('/items');
            }}
          />
        );

      case 'item-edit': {
        const idMatch = location.pathname.match(/\/items\/edit\/(\d+)/);
        const recordId = idMatch ? parseInt(idMatch[1], 10) : 0;
        return (
          <ItemEditPage
            recordId={recordId}
            onBackToList={() => {
              setActiveSidebarTab('item-master');
              setActiveTopTab('item-master');
              navigate('/items');
            }}
          />
        );
      }

      case 'category-list':
        return (
          <CategoryListPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
              navigate('/');
            }}
            onNavigateAdd={() => {
              setActiveSidebarTab('category-add');
              navigate('/categories/add');
            }}
            onNavigateEdit={(id) => {
              setActiveSidebarTab('category-edit');
              navigate(`/categories/edit/${id}`);
            }}
          />
        );

      case 'category-add':
        return (
          <CategoryAddPage
            onBackToList={() => {
              setActiveSidebarTab('category-list');
              setActiveTopTab('category-list');
              navigate('/categories');
            }}
          />
        );

      case 'category-edit': {
        const idMatch = location.pathname.match(/\/categories\/edit\/(\d+)/);
        const recordId = idMatch ? parseInt(idMatch[1], 10) : 0;
        return (
          <CategoryEditPage
            recordId={recordId}
            onBackToList={() => {
              setActiveSidebarTab('category-list');
              setActiveTopTab('category-list');
              navigate('/categories');
            }}
          />
        );
      }

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
          <CustomerListPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
              navigate('/');
            }}
            onNavigateAdd={() => {
              setActiveSidebarTab('customer-add');
              navigate('/customers/add');
            }}
            onNavigateEdit={(id) => {
              setActiveSidebarTab('customer-edit');
              navigate(`/customers/edit/${id}`);
            }}
          />
        );

      case 'customer-add':
        return (
          <CustomerAddPage
            onBackToList={() => {
              setActiveSidebarTab('customers');
              setActiveTopTab('customers');
              navigate('/customers');
            }}
          />
        );

      case 'customer-edit': {
        const idMatch = location.pathname.match(/\/customers\/edit\/(\d+)/);
        const customerId = idMatch ? parseInt(idMatch[1], 10) : 0;
        return (
          <CustomerEditPage
            customerId={customerId}
            onBackToList={() => {
              setActiveSidebarTab('customers');
              setActiveTopTab('customers');
              navigate('/customers');
            }}
          />
        );
      }

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

      case 'stock-list':
        return (
          <StockListPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
              navigate('/');
            }}
            onNavigateAdd={() => {
              setActiveSidebarTab('stock-add');
              navigate('/stock/add');
            }}
            onNavigateEdit={(id) => {
              setActiveSidebarTab('stock-edit');
              navigate(`/stock/edit/${id}`);
            }}
          />
        );

      case 'stock-add':
        return (
          <StockAddPage
            onBackToList={() => {
              setActiveSidebarTab('stock-list');
              setActiveTopTab('stock-list');
              navigate('/stock-list');
            }}
          />
        );

      case 'stock-edit': {
        const idMatch = location.pathname.match(/\/stock\/edit\/(\d+)/);
        const recordId = idMatch ? parseInt(idMatch[1], 10) : 0;
        return (
          <StockEditPage
            recordId={recordId}
            onBackToList={() => {
              setActiveSidebarTab('stock-list');
              setActiveTopTab('stock-list');
              navigate('/stock-list');
            }}
          />
        );
      }

      case 'metal-stock':
        return (
          <MetalStockListPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
              navigate('/');
            }}
            onNavigateAdd={() => {
              setActiveSidebarTab('metal-stock-add');
              navigate('/metal-stock/add');
            }}
            onNavigateEdit={(id) => {
              setActiveSidebarTab('metal-stock-edit');
              navigate(`/metal-stock/edit/${id}`);
            }}
          />
        );

      case 'metal-stock-add':
        return (
          <MetalStockAddPage
            onBackToList={() => {
              setActiveSidebarTab('metal-stock');
              setActiveTopTab('metal-stock');
              navigate('/metal-stock');
            }}
          />
        );

      case 'metal-stock-edit': {
        const idMatch = location.pathname.match(/\/metal-stock\/edit\/(\d+)/);
        const recordId = idMatch ? parseInt(idMatch[1], 10) : 0;
        return (
          <MetalStockEditPage
            recordId={recordId}
            onBackToList={() => {
              setActiveSidebarTab('metal-stock');
              setActiveTopTab('metal-stock');
              navigate('/metal-stock');
            }}
          />
        );
      }

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
          <DailyBalanceListPage
            onBackToDashboard={() => {
              setActiveSidebarTab('dashboard');
              setActiveTopTab('dashboard');
              navigate('/');
            }}
            onNavigateAdd={() => {
              setActiveSidebarTab('daily-balance-add');
              navigate('/daily-balance/add');
            }}
            onNavigateEdit={(id) => {
              setActiveSidebarTab('daily-balance-edit');
              navigate(`/daily-balance/edit/${id}`);
            }}
          />
        );

      case 'daily-balance-add':
        return (
          <DailyBalanceAddPage
            onBackToList={() => {
              setActiveSidebarTab('daily-balance');
              setActiveTopTab('daily-balance');
              navigate('/daily-balance');
            }}
          />
        );

      case 'daily-balance-edit': {
        const idMatch = location.pathname.match(/\/daily-balance\/edit\/(\d+)/);
        const recordId = idMatch ? parseInt(idMatch[1], 10) : 0;
        return (
          <DailyBalanceEditPage
            recordId={recordId}
            onBackToList={() => {
              setActiveSidebarTab('daily-balance');
              setActiveTopTab('daily-balance');
              navigate('/daily-balance');
            }}
          />
        );
      }

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
              setActiveSidebarTab('party-ledgers');
              setActiveTopTab('reports');
              navigate('/party-ledgers');
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
              setActiveSidebarTab('party-ledgers');
              setActiveTopTab('reports');
              navigate('/party-ledgers');
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
          setActiveSidebarTab('party-ledgers');
          setActiveTopTab('reports');
          navigate('/party-ledgers');
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
            else if (tab === 'inventory' || tab === 'item-master' || tab === 'category-list') setActiveTopTab('inventory');
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
