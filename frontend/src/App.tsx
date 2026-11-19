import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar } from './components/Sidebar';
import { MainDashboard } from './components/MainDashboard';
import { PosBillingModal } from './components/PosBillingModal';
import { AccountLedgerModal } from './components/AccountLedgerModal';
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
import { DailyRates, DailySummary, BillingItem } from './types';

const MainApp: React.FC = () => {
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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
};

export default App;
