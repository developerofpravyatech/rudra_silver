import React from 'react';
import { X, User, Phone, Mail, MapPin, Briefcase, Heart, Calendar, FileText, Sparkles, Building2, Edit } from 'lucide-react';
import { CustomerRecord } from '../../types';

interface CustomerViewModalProps {
  customer: CustomerRecord | null;
  onClose: () => void;
  onEdit?: (id: number) => void;
}

export const CustomerViewModal: React.FC<CustomerViewModalProps> = ({
  customer,
  onClose,
  onEdit,
}) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f1319] w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-100 dark:border-blue-800/40">
              {customer.Name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {customer.Name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ID #{customer.CustomerID}
                </span>
              </div>
              {customer.FirmName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {customer.FirmName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(customer.CustomerID);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Personal Information */}
          <div className="bg-slate-50/60 dark:bg-white/[0.01] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Full Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{customer.Name || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Gender</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {customer.Gender || 'Male'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Date of Birth</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.DOB || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Marital Status</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold ${customer.Married ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {customer.Married ? 'Married' : 'Single'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Spouse Name</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.Spouse || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Spouse DOB</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.SpouseDOB || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Anniversary</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.Anniversary || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Education</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.Education || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address Details */}
          <div className="bg-slate-50/60 dark:bg-white/[0.01] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Contact & Address Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Mobile</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.Mobile || '-'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Phone</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.Phone || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customer.Email || '-'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Location / Area</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.Location || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">City</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.City || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">PIN Code / Country</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {customer.Pin || '-'} / {customer.Country || 'India'}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500 block">Address</span>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {[customer.Address1, customer.Address2, customer.Address3].filter(Boolean).join(', ') || 'No address provided'}
              </p>
            </div>
          </div>

          {/* Section 3: Business & Tax Details */}
          <div className="bg-slate-50/60 dark:bg-white/[0.01] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Business & Tax Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Firm Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{customer.FirmName || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Occupation</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.Occupation || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Potential</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ₹{Number(customer.Potential || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">PAN Number</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{customer.PANNo || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Aadhaar Number</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{customer.Aadhaar || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">GST Number</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{customer.GSTNo || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Jewelry Preferences & Remarks */}
          <div className="bg-slate-50/60 dark:bg-white/[0.01] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Jewelry Preferences & Remarks
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Jewelry Knowledge</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.JewKnow || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Ring Size</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.RingSize || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Bangle Size</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.BangleSize || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Referred By</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.RefBy || '-'}</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1">Remarks</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-black/20 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 italic">
                {customer.Remarks || 'No remarks added.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
