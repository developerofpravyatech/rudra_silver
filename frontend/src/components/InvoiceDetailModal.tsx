import React from 'react';

interface InvoiceDetailModalProps {
  invoice: any;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#141822] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm">Invoice #{invoice.voucher_no || invoice.id}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        {/* A. Invoice Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Invoice Number</label>
            <p className="font-semibold text-slate-900 dark:text-white">{invoice.voucher_no || '-'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
            <p className="font-semibold text-slate-900 dark:text-white">
              {invoice.voucher_date ? new Date(invoice.voucher_date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Series</label>
            <p className="font-semibold text-slate-900 dark:text-white">{invoice.series || '-'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Voucher Type</label>
            <p className="font-semibold text-slate-900 dark:text-white">{invoice.voucher_type || '-'}</p>
          </div>
        </div>

        {/* B. Customer / Supplier Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Customer / Supplier</label>
            <p className="font-semibold text-slate-900 dark:text-white">{invoice.account_name || 'Walk-in Customer'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mobile</label>
            <p className="font-semibold text-slate-900 dark:text-white">{invoice.account_mobile || '-'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Payment Mode</label>
              <p className="font-semibold text-slate-900 dark:text-white">{invoice.payment_mode || '-'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
              {invoice.payment_status ? (
                <p
                  className={
                    invoice.payment_status === 'PAID'
                      ? 'text-emerald-600 font-semibold'
                      : invoice.payment_status === 'PARTIAL'
                      ? 'text-amber-600 font-semibold'
                      : 'text-rose-600 font-semibold'
                  }
                >
                  {invoice.payment_status}
                </p>
              ) : (
                <p className="font-semibold text-rose-600">Unpaid</p>
              )}
            </div>
          </div>
        </div>

        {/* C. Amount Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Gross Amount</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.gross_amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Discount</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.discount_amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Taxable Amount</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.taxable_amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Net Amount</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.net_amount || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* GST Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CGST</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.cgst_amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">SGST</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.sgst_amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">IGST</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.igst_amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Round Off</label>
            <p className="font-semibold text-slate-900 dark:text-white">₹{Number(invoice.round_off || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* D. Invoice Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[10px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3 text-center">Metal Type</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-center">Gross Weight</th>
                <th className="p-3 text-center">Stone Weight</th>
                <th className="p-3 text-center">Net Weight</th>
                <th className="p-3 text-center">Purity</th>
                <th className="p-3 text-center">Rate (₹/g)</th>
                <th className="p-3 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-slate-200 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  >
                    <td className="p-3 font-sans">{item.item_description || `Item ${index + 1}`}</td>
                    <td className="p-3 text-center text-slate-500 dark:text-slate-400">{item.metal_type || '-'}</td>
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300">{item.pieces || 1}</td>
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300">{Number(item.gross_weight || 0).toFixed(3)} g</td>
                    <td className="p-3 text-center text-slate-500 dark:text-slate-400">{Number(item.stone_weight || 0).toFixed(3)} g</td>
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300">{Number(item.net_weight || 0).toFixed(3)} g</td>
                    <td className="p-3 text-center text-slate-500 dark:text-slate-400">{item.purity_touch || '-'}</td>
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300">₹{Number(item.metal_rate_per_gram || 0).toFixed(2)}</td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                      ₹{Number(item.total_item_amount || item.metal_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-slate-500 dark:text-slate-400">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* E. Payment Information Section */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {invoice.payments.map((pay: any, idx: number) => (
              <div key={idx} className="p-3 rounded border border-slate-200 dark:border-white/[0.04]">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Payment {idx + 1}</label>
                <p className="font-semibold text-slate-900 dark:text-white">Mode: {pay.payment_mode || 'CASH'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Amount: ₹{Number(pay.amount || 0).toFixed(2)}</p>
                {pay.reference_no && <p className="text-xs text-slate-500 dark:text-slate-400">Ref: {pay.reference_no}</p>}
              </div>
            ))}
          </div>
        )}

        {/* F. Narration */}
        {invoice.narration && (
          <div className="mt-6 p-3 rounded border border-slate-200 dark:border-white/[0.04]">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Narration</label>
            <p className="text-sm text-slate-700 dark:text-slate-300">{invoice.narration}</p>
          </div>
        )}
      </div>
    </div>
  );
};
