import React, { useState } from 'react';
import { DailyRates } from '../types';
import { Scale } from 'lucide-react';

interface TopNavProps {
  rates: DailyRates | null;
  liveWeight: number;
  isScaleConnected: boolean;
  onConnectScale: () => void;
  onOpenVoucher: (type: string) => void;
  onOpenLedger: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  rates,
  liveWeight,
  isScaleConnected,
  onConnectScale,
  onOpenVoucher,
  onOpenLedger
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const menuItems: Record<string, { label: string; action?: () => void }[]> = {
    Maintain: [
      { label: 'Accounts (Customer/Supplier/Karigar)', action: onOpenLedger },
      { label: 'Item & Jewellery Catalogue' },
      { label: 'Stamp & Purity Standards' },
      { label: 'Diamond & Stone Setup' },
      { label: 'Opening Stock Entry' },
      { label: 'Company Details & Setup' },
      { label: 'Girvi Master Setup' }
    ],
    Voucher: [
      { label: '1. Receipt', action: () => onOpenVoucher('RECEIPT') },
      { label: '2. Payment', action: () => onOpenVoucher('PAYMENT') },
      { label: '3. Sale (Tax Invoice)', action: () => onOpenVoucher('SALE') },
      { label: '4. Purchase', action: () => onOpenVoucher('PURCHASE') },
      { label: '5. Sale Return', action: () => onOpenVoucher('SALE_RETURN') },
      { label: '6. Purchase Return', action: () => onOpenVoucher('PURCHASE_RETURN') },
      { label: '7. Journal', action: () => onOpenVoucher('JOURNAL') },
      { label: '8. Contra', action: () => onOpenVoucher('CONTRA') },
      { label: '9. Issue (Approval/Karigar)', action: () => onOpenVoucher('APPROVAL_ISSUE') },
      { label: '0. Receive', action: () => onOpenVoucher('APPROVAL_RETURN') },
      { label: '+ Order', action: () => onOpenVoucher('ORDER_ADVANCE') }
    ],
    Feeding: [
      { label: 'Daily Bhav (Board Rates)' },
      { label: 'Sauda Book (Bullion Booking)' },
      { label: 'Product Catalogue' },
      { label: 'Naam Jama (Traditional Journal)' },
      { label: 'Staff Attendance' },
      { label: 'Tunch Purity Testing Record' },
      { label: 'Bank Reconciliation' }
    ],
    Reports: [
      { label: 'Ledger (Detailed / Short)', action: onOpenLedger },
      { label: 'Daily Cash & Bank Books' },
      { label: 'Stock Status (Tagged & Loose)' },
      { label: 'Sale Registers (Bill & Party wise)' },
      { label: 'Purchase Registers' },
      { label: 'Karigar Metal Ledger Sheet' },
      { label: 'Trial Balance & Balance Sheet' },
      { label: 'GST Returns (GSTR-1, GSTR-3B)' }
    ],
    Utilities: [
      { label: 'Tally Prime XML Export' },
      { label: 'Backup & Restore Database' },
      { label: 'Freeze Date' },
      { label: 'Year-End Closing & Refresh' },
      { label: 'Interest Calculator' }
    ],
    Exit: [
      { label: 'Close System' }
    ]
  };

  return (
    <div className="bg-[#244b70] text-white">
      {/* Window Title Bar */}
      <div className="bg-[#17334e] px-3 py-1 flex justify-between items-center text-[11px] font-mono border-b border-[#305980]">
        <div className="flex items-center space-x-2 truncate">
          <span className="font-bold text-amber-300">Jwelly Lite R</span>
          <span className="text-slate-300">XXXXXXXXXXXXXTXXXXXX/0/1/0/C:2 (Sep 2024/10)</span>
          <span className="bg-amber-500/20 text-amber-200 px-1.5 py-0.2 rounded font-semibold border border-amber-400/30">
            RUDRA SILVER ORNAMENTS 1001
          </span>
          <span className="text-slate-300">D:[HDD] (User :ERP ) S 2026-2027</span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Live Weighing Scale Button */}
          <button
            onClick={onConnectScale}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold transition ${
              isScaleConnected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Scale className="w-3 h-3" />
            {isScaleConnected ? `Scale Online: ${liveWeight.toFixed(3)}g` : 'Connect Weighing Scale'}
          </button>
        </div>
      </div>

      {/* Main Menu Bar */}
      <div className="px-3 py-1 flex justify-between items-center text-xs bg-[#2b5680] border-b border-[#1b3d5e]">
        <div className="flex space-x-1 relative">
          {Object.keys(menuItems).map((menu) => (
            <div key={menu} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === menu ? null : menu)}
                className={`px-3 py-1 rounded transition text-xs font-semibold ${
                  openDropdown === menu ? 'bg-[#1b3c5e] text-amber-300' : 'hover:bg-[#346594] text-slate-100'
                }`}
              >
                {menu}
              </button>

              {/* Dropdown Menu */}
              {openDropdown === menu && (
                <div
                  className="absolute left-0 mt-1 w-64 bg-white text-slate-900 border border-slate-300 rounded shadow-xl z-50 py-1"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {menuItems[menu].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setOpenDropdown(null);
                        if (item.action) item.action();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-100/70 text-xs font-medium border-b border-slate-100 last:border-b-0 flex justify-between items-center"
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Bhav Ticker */}
        <div className="flex items-center space-x-4 text-[11px] font-mono">
          <span className="text-amber-300 font-bold">Gold 24K: ₹{rates?.gold_24k_sell_rate?.toLocaleString() ?? '78,500'}/10g</span>
          <span className="text-slate-300 font-bold">Silver 999: ₹{rates?.silver_pure_sell_rate?.toLocaleString() ?? '92,000'}/kg</span>
          <span className="text-emerald-300 font-bold">Silver 92.5: ₹{rates?.silver_925_rate?.toLocaleString() ?? '85,100'}/kg</span>
        </div>
      </div>
    </div>
  );
};
