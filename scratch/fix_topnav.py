p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\TopNavbar.tsx"
s = open(p).read()

old = """      {/* Center: Main Navigation Tabs */}
      <nav className="flex items-center bg-slate-100 dark:bg-[#131720] p-1 rounded-xl border border-slate-200 dark:border-white/[0.07] shadow-inner space-x-1">
        {topNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTopTabResolved === tab.id;
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
      </nav>"""

new = """      {/* Center: Main Navigation Tabs */}
      <nav className="flex items-center bg-slate-100 dark:bg-[#131720] p-1 rounded-xl border border-slate-200 dark:border-white/[0.07] shadow-inner space-x-1">
        {/* Dashboard */}
        <button
          onClick={() => { setActiveTopTab('dashboard'); navigate('/'); }}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeTopTabResolved === 'dashboard'
            ? 'bg-white text-amber-700 font-semibold border border-amber-300 shadow-sm dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60 dark:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]'
            }`}
        >
          <Home className={`w-3.5 h-3.5 ${activeTopTabResolved === 'dashboard' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span>Dashboard</span>
        </button>

        {/* Billing dropdown */}
        <div className="relative" ref={billingRef}>
          <button
            onClick={() => setBillingOpen((o) => !o)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeTopTabResolved === 'billing'
              ? 'bg-white text-amber-700 font-semibold border border-amber-300 shadow-sm dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60 dark:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]'
              }`}
          >
            <FileText className={`w-3.5 h-3.5 ${activeTopTabResolved === 'billing' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Billing</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {billingOpen && (
            <div className="absolute left-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141822] shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => { setBillingOpen(false); if (onOpenNewBilling) onOpenNewBilling(); navigate('/billing/new'); setActiveTopTab('billing'); }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
              >
                New Billing
              </button>
              <button
                onClick={() => { setBillingOpen(false); navigate('/daily-balance'); setActiveTopTab('billing'); }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
              >
                Daily Balance
              </button>
            </div>
          )}
        </div>

        {/* Inventory dropdown */}
        <div className="relative" ref={inventoryRef}>
          <button
            onClick={() => setInventoryOpen((o) => !o)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeTopTabResolved === 'inventory'
              ? 'bg-white text-amber-700 font-semibold border border-amber-300 shadow-sm dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60 dark:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]'
              }`}
          >
            <Box className={`w-3.5 h-3.5 ${activeTopTabResolved === 'inventory' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Inventory</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {inventoryOpen && (
            <div className="absolute left-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141822] shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => { setInventoryOpen(false); if (onOpenCatalogue) onOpenCatalogue(); navigate('/inventory'); setActiveTopTab('inventory'); }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
              >
                Inventory
              </button>
              <button
                onClick={() => { setInventoryOpen(false); navigate('/stock-list'); setActiveTopTab('inventory'); }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
              >
                Stock
              </button>
            </div>
          )}
        </div>
      </nav>"""

assert old in s
s = s.replace(old, new, 1)
open(p, "w").write(s)
print("done")