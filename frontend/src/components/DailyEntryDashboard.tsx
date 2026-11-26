import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailySummary } from '../types';

interface DailyEntryDashboardProps {
  summary: DailySummary;
  onOpenVoucher: (type: string) => void;
  onOpenLedger: () => void;
}

export const DailyEntryDashboard: React.FC<DailyEntryDashboardProps> = ({
  summary,
  onOpenVoucher,
  onOpenLedger
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<string>(summary.date || '2026-11-17');
  const dayName = new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' });
  const [summaryDate, setSummaryDate] = useState<string>(summary.date || '2026-11-17');

  // Auto-refresh summary data every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Would need to call an API to refresh summary - for now keep existing state
      // The summary prop is expected to be updated by parent component
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Handle keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && !window.getSelection()?.toString()) {
        e.preventDefault();
        navigate('/customer-profit-report');
        return;
      }

      // Check numeric shortcuts 1-0, +, -
      switch (e.key) {
        case '1': onOpenVoucher('RECEIPT'); break;
        case '2': onOpenVoucher('PAYMENT'); break;
        case '3': onOpenVoucher('SALE'); break;
        case '4': onOpenVoucher('PURCHASE'); break;
        case '5': onOpenVoucher('SALE_RETURN'); break;
        case '6': onOpenVoucher('PURCHASE_RETURN'); break;
        case '7': onOpenVoucher('JOURNAL'); break;
        case '8': onOpenVoucher('CONTRA'); break;
        case '9': onOpenVoucher('APPROVAL_ISSUE'); break;
        case '0': onOpenVoucher('APPROVAL_RETURN'); break;
        case '+': onOpenVoucher('ORDER_ADVANCE'); break;
        case '-': onOpenVoucher('REPAIR'); break;
        case 'a':
        case 'A': onOpenVoucher('CASH_SALE'); break;
        case 'b':
        case 'B': onOpenVoucher('STOCK_JOURNAL'); break;
        case 'c':
        case 'C': onOpenVoucher('QUOTATION'); break;
        case 'd':
        case 'D': onOpenVoucher('CREDIT_NOTE'); break;
        case 'e':
        case 'E': onOpenVoucher('VOUCHER'); break;
        case 'f':
        case 'F': onOpenVoucher('JOB_ORDER'); break;
        case 'g':
        case 'G': onOpenVoucher('EXPENSE'); break;
        case 'F1': e.preventDefault(); onOpenLedger(); break;
        case 'F2': e.preventDefault(); navigate('/metal-stock'); break;
        case 'F3': e.preventDefault(); navigate('/daily-balance'); break;
        case 'F4': e.preventDefault(); navigate('/age-wise-list'); break;
        case 'F5': e.preventDefault(); navigate('/transactions'); break;
        case 'F7': e.preventDefault(); navigate('/silver-bullion'); break;
        case 'F9': e.preventDefault(); navigate('/stock-list'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenVoucher, onOpenLedger]);

  const voucherButtons = [
    { num: '1', label: 'Receipt', count: summary.voucher_counts['receipt'] || 0, type: 'RECEIPT' },
    { num: '2', label: 'Payment', count: summary.voucher_counts['payment'] || 0, type: 'PAYMENT' },
    { num: '3', label: 'Sale', count: summary.voucher_counts['sale'] || 0, type: 'SALE' },
    { num: '4', label: 'Purchase', count: summary.voucher_counts['purchase'] || 0, type: 'PURCHASE' },
    { num: '5', label: 'Sale Return', count: summary.voucher_counts['sale_return'] || 0, type: 'SALE_RETURN' },
    { num: '6', label: 'Pur. Return', count: summary.voucher_counts['purchase_return'] || 0, type: 'PURCHASE_RETURN' },
    { num: '7', label: 'Journal', count: summary.voucher_counts['journal'] || 0, type: 'JOURNAL' },
    { num: '8', label: 'Contra', count: summary.voucher_counts['contra'] || 0, type: 'CONTRA' },
    { num: '9', label: 'Issue', count: summary.voucher_counts['issue'] || 0, type: 'APPROVAL_ISSUE' },
    { num: '0', label: 'Receive', count: summary.voucher_counts['receive'] || 0, type: 'APPROVAL_RETURN' },
    { num: '+', label: 'Order', count: summary.voucher_counts['order'] || 0, type: 'ORDER_ADVANCE' },
    { num: '-', label: 'Repair', count: summary.voucher_counts['repair'] || 0, type: 'REPAIR' }
  ];

  const actionButtons = [
    { key: 'A', label: 'Cash', type: 'CASH_SALE' },
    { key: 'B', label: 'Stk. Journal', type: 'STOCK_JOURNAL' },
    { key: 'C', label: 'Quotation', type: 'QUOTATION' },
    { key: 'D', label: 'Credit Note', type: 'CREDIT_NOTE' },
    { key: 'E', label: 'Voucher', type: 'VOUCHER' },
    { key: 'F', label: 'Job Order', type: 'JOB_ORDER' },
    { key: 'G', label: 'EXPENSE', type: 'EXPENSE' }
  ];

  const fKeyShortcuts = [
    { key: 'F1', label: 'Ledger Short', action: onOpenLedger },
    { key: 'F2', label: 'Metal Stock', action: () => navigate('/metal-stock') },
    { key: 'F3', label: 'Daily Balance', action: () => navigate('/daily-balance') },
    { key: 'F4', label: 'Age Wise', action: () => navigate('/age-wise-list') },
    { key: 'F5', label: 'Daily Transaction', action: () => navigate('/transactions') },
    { key: 'F6', label: 'Cash Book' },
    { key: 'F7', label: 'Silver Bullion', action: () => navigate('/silver-bullion') },
    { key: 'F9', label: 'Stock', action: () => navigate('/stock-list') },
    { key: 'Ctrl+A', label: 'Sale Register' },
    { key: 'Ctrl+B', label: 'Purchase Register' },
    { key: 'Ctrl+C', label: 'Profit Customer wis', action: () => navigate('/customer-profit-report') },
    { key: 'Ctrl+D', label: 'sale Detailed' },
    { key: 'Ctrl+E', label: 'purchase Detailed' }
  ];

  return (
    <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
      {/* Main Center Area with 3 Columns (Center Window, Action Column, F-Keys Column) */}
      <div className="flex gap-3 items-start justify-center max-w-[1450px] mx-auto w-full">
        {/* Center Daily Entry Window */}
        <div className="flex-1 bg-[#f4f1ea] border-2 border-[#9faebf] rounded shadow-md overflow-hidden max-w-[850px]">
          {/* Daily Entry Title Bar */}
          <div className="bg-gradient-to-r from-[#3c6e9a] to-[#20496f] text-white px-3 py-1 font-semibold text-xs flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 inline-block rounded-sm"></span>
              Daily Entry
            </span>
            <span className="cursor-pointer text-slate-300 hover:text-white">✕</span>
          </div>

          <div className="p-4 space-y-3">
            {/* Header: Date & Day */}
            <div className="flex justify-center items-center space-x-6 text-sm font-semibold text-slate-800">
              <span>Daily Transaction As On</span>
              <span className="text-blue-900 font-mono underline decoration-blue-500 font-bold tracking-wider">
                {currentDate.split('-').reverse().join('/')}
              </span>
              <span className="text-slate-700">{dayName}</span>
            </div>

            {/* Opening Cash Box */}
            <div className="flex items-center justify-start space-x-4 pl-4 pt-1">
              <span className="text-xs font-bold text-slate-800 w-28">Opening Cash</span>
              <div className="w-36 bg-[#fdf5e6] border border-slate-400 px-3 py-1 text-right font-mono font-bold text-sm text-purple-900 rounded shadow-inner">
                {summary.opening_cash.toLocaleString()}
              </div>
            </div>

            {/* 12 Primary Numeric Buttons Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 px-4 py-2 border-t border-b border-slate-300/60 my-2">
              {voucherButtons.map((btn) => (
                <div key={btn.num} className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenVoucher(btn.type)}
                    className="flex-1 flex items-center justify-between px-3 py-1.5 border border-[#8da4bc] bg-gradient-to-b from-[#fafdff] to-[#ddeaf6] hover:from-[#dbe8f5] hover:to-[#c3d8ea] active:to-[#b1cde3] rounded shadow-sm text-slate-900 font-semibold text-xs transition"
                  >
                    <span className="underline decoration-slate-500 font-bold">{btn.num}.</span>
                    <span className="flex-1 text-left pl-2">{btn.label}</span>
                  </button>
                  {/* Daily Count Box */}
                  <div className="w-28 bg-[#ebf3fb] border border-[#a2b9d0] px-3 py-1 text-right font-mono font-bold text-xs text-blue-950 rounded shadow-inner">
                    {btn.count}
                  </div>
                </div>
              ))}
            </div>

            {/* Closing Cash Box */}
            <div className="flex items-center justify-end space-x-4 pr-4">
              <span className="text-xs font-bold text-slate-800">Closing Cash</span>
              <div className="w-36 bg-[#fdf5e6] border border-slate-400 px-3 py-1 text-right font-mono font-bold text-sm text-purple-900 rounded shadow-inner">
                {summary.closing_cash.toLocaleString()}
              </div>
            </div>

            {/* Date Navigation Helpers */}
            <div className="flex space-x-6 text-[11px] font-bold text-red-700 pl-4 pt-1">
              <span>[TAB] &nbsp; DATE CHANGE</span>
              <span>[PG UP] &nbsp; PREV DATE</span>
              <span>[PG DOWN] &nbsp; NEXT DATE</span>
            </div>
          </div>
        </div>

        {/* Right Action Bar (Buttons A to G) */}
        <div className="w-36 flex flex-col space-y-1.5 pt-1">
          {actionButtons.map((act) => (
            <button
              key={act.key}
              onClick={() => onOpenVoucher(act.type)}
              className="flex items-center space-x-2 px-2.5 py-1.5 border border-[#8da4bc] bg-gradient-to-b from-[#fafdff] to-[#ddeaf6] hover:from-[#dbe8f5] hover:to-[#c3d8ea] rounded shadow-sm text-xs font-bold text-[#1c4164] transition"
            >
              <span className="w-5 h-5 bg-[#305980] text-white flex items-center justify-center rounded-sm text-[11px] font-bold shadow-xs">
                {act.key}
              </span>
              <span className="truncate">{act.label}</span>
            </button>
          ))}
        </div>

        {/* Far Right Function Keys Sidebar (F1 to F9 & Ctrl Shortcuts) */}
        <div className="w-48 flex flex-col space-y-1 pt-1 bg-[#edf4fa]/80 p-1.5 rounded border border-[#b2c8de]">
          {fKeyShortcuts.map((fk) => (
            <button
              key={fk.key}
              onClick={fk.action}
              className="flex items-center justify-between px-2 py-1 bg-gradient-to-b from-[#ffffff] to-[#e7f1f9] hover:from-[#e4f0fa] hover:to-[#d0e4f5] border border-[#a2bad1] rounded text-[11px] font-medium text-slate-800 shadow-2xs transition"
            >
              <span className="font-bold text-blue-900 w-12 text-left font-mono">{fk.key}</span>
              <span className="flex-1 text-left truncate">{fk.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Screen Footer with MMI Softwares Attribution */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-700 max-w-[1450px] mx-auto w-full font-sans">
        <div className="flex items-center space-x-3">
          <div className="font-bold text-lg tracking-tight text-amber-700">Jwelly</div>
          <span className="text-slate-500 italic">freedom to grow</span>
          <span className="text-slate-400">|</span>
          <span>A Feature of : <strong>M.M.I. Softwares (P) Ltd</strong></span>
          <span className="text-slate-400">|</span>
          <span className="font-mono font-bold text-slate-800">ID - JE19789</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>For Service Support Kindly Dial: <strong>0565 - 7153333 (100 Lines)</strong></span>
          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 font-medium">
            Missed call: 8745992233
          </span>
          <span className="text-blue-900 font-bold">Ctrl+H HELP</span>
        </div>
      </div>
    </div>
  );
};
