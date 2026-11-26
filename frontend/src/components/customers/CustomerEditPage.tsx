import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
} from 'lucide-react';
import { fetchCustomerByIdApi, updateCustomerApi } from '../../services/api';
import { showSuccessAlert, showErrorAlert, showValidationAlert } from '../../utils/alert';

interface CustomerEditPageProps {
  customerId: number;
  onBackToList?: () => void;
}

export const CustomerEditPage: React.FC<CustomerEditPageProps> = ({
  customerId,
  onBackToList,
}) => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    Name: '',
    Gender: 'Male' as 'Male' | 'Female' | 'Other',
    DOB: '',
    Married: false,
    Spouse: '',
    SpouseDOB: '',
    Anniversary: '',
    Education: '',

    FirmName: '',
    Address1: '',
    Address2: '',
    Address3: '',
    Location: '',
    City: '',
    Pin: '',
    Country: 'India',
    Phone: '',
    Mobile: '',
    Email: '',

    Occupation: '',
    Potential: '0',
    PANNo: '',
    Aadhaar: '',
    GSTNo: '',

    JewKnow: '',
    RingSize: '',
    BangleSize: '',
    RefBy: '',
    Remarks: '',
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setServerError(null);

    fetchCustomerByIdApi(customerId)
      .then((data) => {
        if (!isMounted) return;
        const loaded = {
          Name: data.Name || '',
          Gender: (data.Gender || 'Male') as 'Male' | 'Female' | 'Other',
          DOB: data.DOB || '',
          Married: Boolean(Number(data.Married)),
          Spouse: data.Spouse || '',
          SpouseDOB: data.SpouseDOB || '',
          Anniversary: data.Anniversary || '',
          Education: data.Education || '',

          FirmName: data.FirmName || '',
          Address1: data.Address1 || '',
          Address2: data.Address2 || '',
          Address3: data.Address3 || '',
          Location: data.Location || '',
          City: data.City || '',
          Pin: data.Pin || '',
          Country: data.Country || 'India',
          Phone: data.Phone || '',
          Mobile: data.Mobile || '',
          Email: data.Email || '',

          Occupation: data.Occupation || '',
          Potential: String(data.Potential ?? '0'),
          PANNo: data.PANNo || '',
          Aadhaar: data.Aadhaar || '',
          GSTNo: data.GSTNo || '',

          JewKnow: data.JewKnow || '',
          RingSize: data.RingSize || '',
          BangleSize: data.BangleSize || '',
          RefBy: data.RefBy || '',
          Remarks: data.Remarks || '',
        };
        setFormData(loaded);
        setInitialData(loaded);
      })
      .catch((err: any) => {
        if (isMounted) {
          setServerError(err.message || 'Failed to load customer details.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear validation error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // 1. Name is required
    if (!formData.Name.trim()) {
      newErrors.Name = 'This field is required.';
    }

    // 2. Gender is required
    if (!formData.Gender) {
      newErrors.Gender = 'This field is required.';
    }

    // 3. Mobile validation (required if provided)
    if (formData.Mobile.trim()) {
      const cleanMobile = formData.Mobile.trim().replace(/\s+|-/g, '');
      if (!/^\d{10}$/.test(cleanMobile)) {
        newErrors.Mobile = 'Mobile number must be exactly 10 digits.';
      }
    } else {
      newErrors.Mobile = 'Mobile number is required.';
    }

    // 4. Email validation (required if provided)
    if (formData.Email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email.trim())) {
        newErrors.Email = 'Please enter a valid email address.';
      }
    } else {
      newErrors.Email = 'Email address is required.';
    }

    // 5. PIN Code validation (required if provided)
    if (formData.Pin.trim()) {
      if (!/^\d{6}$/.test(formData.Pin.trim())) {
        newErrors.Pin = 'PIN Code must be exactly 6 digits.';
      }
    } else {
      newErrors.Pin = 'PIN Code is required.';
    }

    // 6. PAN Number validation (required if provided)
    if (formData.PANNo.trim()) {
      if (!/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/.test(formData.PANNo.trim())) {
        newErrors.PANNo = 'PAN Number must be in format ABCDE1234F.';
      }
    } else {
      newErrors.PANNo = 'PAN Number is required.';
    }

    // 7. Aadhaar Number validation (required if provided)
    if (formData.Aadhaar.trim()) {
      const cleanAadhaar = formData.Aadhaar.trim().replace(/\s+|-/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        newErrors.Aadhaar = 'Aadhaar Number must be exactly 12 digits.';
      }
    } else {
      newErrors.Aadhaar = 'Aadhaar Number is required.';
    }

    // 8. GST Number validation (required if provided)
    if (formData.GSTNo.trim()) {
      if (!/^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}Z[0-9A-Za-z]{1}$/.test(formData.GSTNo.trim())) {
        newErrors.GSTNo = 'GST Number must be a valid 15-character GSTIN.';
      }
    } else {
      newErrors.GSTNo = 'GST Number is required.';
    }

    // 9. Potential validation (required if provided)
    if (formData.Potential !== '') {
      const pot = parseFloat(formData.Potential);
      if (isNaN(pot)) {
        newErrors.Potential = 'Must be a valid number.';
      }
    } else {
      newErrors.Potential = 'Potential is required.';
    }

    // 10. DOB validation
    if (formData.DOB && formData.DOB > todayStr) {
      newErrors.DOB = 'Date of Birth cannot be in the future.';
    }

    // 11. Spouse DOB validation
    if (formData.SpouseDOB && formData.SpouseDOB > todayStr) {
      newErrors.SpouseDOB = 'Spouse Date of Birth cannot be in the future.';
    }

    // 12. Education is required
    if (!formData.Education.trim()) {
      newErrors.Education = 'This field is required.';
    }

    // 13. Marital Status is required
    if (!formData.Married) {
      newErrors.Married = 'This field is required.';
    }

    // 14. Spouse Name is required
    if (!formData.Spouse.trim()) {
      newErrors.Spouse = 'This field is required.';
    }

    // 15. Anniversary is required
    if (!formData.Anniversary.trim()) {
      newErrors.Anniversary = 'This field is required.';
    }

    // 16. Firm/Company Name is required
    if (!formData.FirmName.trim()) {
      newErrors.FirmName = 'This field is required.';
    }

    // 17. City is required
    if (!formData.City.trim()) {
      newErrors.City = 'This field is required.';
    }

    // 18. Address Line 1 is required
    if (!formData.Address1.trim()) {
      newErrors.Address1 = 'This field is required.';
    }

    // 19. Address Line 2 is required
    if (!formData.Address2.trim()) {
      newErrors.Address2 = 'This field is required.';
    }

    // 20. Address Line 3 is required
    if (!formData.Address3.trim()) {
      newErrors.Address3 = 'This field is required.';
    }

    // 21. Location/Area is required
    if (!formData.Location.trim()) {
      newErrors.Location = 'This field is required.';
    }

    // 22. PAN No format validation (required if provided)
    if (formData.PANNo.trim()) {
      if (!/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/.test(formData.PANNo.trim())) {
        newErrors.PANNo = 'PAN Number must be in format ABCDE1234F.';
      }
    }

    // 23. Aadhaar format validation (required if provided)
    if (formData.Aadhaar.trim()) {
      const cleanAadhaar = formData.Aadhaar.trim().replace(/\s+|-/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        newErrors.Aadhaar = 'Aadhaar Number must be exactly 12 digits.';
      }
    }

    // 24. GST format validation (required if provided)
    if (formData.GSTNo.trim()) {
      if (!/^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}Z[0-9A-Za-z]{1}$/.test(formData.GSTNo.trim())) {
        newErrors.GSTNo = 'GST Number must be a valid 15-character GSTIN.';
      }
    }

    setErrors(newErrors);
    const firstInvalid = Object.keys(newErrors)[0];
    if (firstInvalid) {
      setTimeout(() => {
        const el = (document.querySelector(`[name="${firstInvalid}"]`) ||
                    document.querySelector('.border-red-500, .border-red-400')) as HTMLElement | null;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        Gender: formData.Gender as 'Male' | 'Female' | 'Other',
        Potential: parseFloat(formData.Potential) || 0,
        PANNo: formData.PANNo.toUpperCase().trim(),
        GSTNo: formData.GSTNo.toUpperCase().trim(),
        Married: formData.Married ? 1 : 0,
      };

      await updateCustomerApi(customerId, payload);
      await showSuccessAlert('Customer updated successfully!', 'Success!');

      if (onBackToList) {
        onBackToList();
      } else {
        navigate('/customers');
      }
    } catch (err: any) {
      if (err?.validation_errors) {
        setErrors(err.validation_errors);
      }
      const msg = err.message || 'Failed to update customer. Please try again.';
      setServerError(msg);
      showErrorAlert(msg, 'Error!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      setErrors({});
      setServerError(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading customer #{customerId}...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0f1319] rounded-2xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              if (onBackToList) onBackToList();
              else navigate('/customers');
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Edit Customer #{customerId}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-10">
              Update customer details, addresses, business info and preferences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Saved
          </button>
          <button
            type="submit"
            form="customer-edit-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <form id="customer-edit-form" onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Personal Information */}
        <div className="bg-white dark:bg-[#0f1319] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              1. Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleInputChange}
                onBlur={() => {
                  if (!formData.Name.trim()) {
                    setErrors((prev) => ({ ...prev, Name: 'This field is required.' }));
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.Name ? 'border-red-500 text-red-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.Name && <p className="text-[11px] text-red-500 mt-1">{errors.Name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                name="Gender"
                value={formData.Gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="DOB"
                max={todayStr}
                value={formData.DOB}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.DOB ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.DOB && <p className="text-[11px] text-red-500 mt-1">{errors.DOB}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Education
              </label>
              <input
                type="text"
                name="Education"
                value={formData.Education}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marital Status
              </label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="Married"
                  checked={formData.Married}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {formData.Married ? 'Married' : 'Single / Unmarried'}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Spouse Name
              </label>
              <input
                type="text"
                name="Spouse"
                value={formData.Spouse}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Spouse Date of Birth
              </label>
              <input
                type="date"
                name="SpouseDOB"
                max={todayStr}
                value={formData.SpouseDOB}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.SpouseDOB ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.SpouseDOB && <p className="text-[11px] text-red-500 mt-1">{errors.SpouseDOB}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anniversary Date
              </label>
              <input
                type="date"
                name="Anniversary"
                value={formData.Anniversary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Contact & Address Details */}
        <div className="bg-white dark:bg-[#0f1319] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              2. Contact & Address Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Firm / Company Name
              </label>
              <input
                type="text"
                name="FirmName"
                value={formData.FirmName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                name="Mobile"
                maxLength={10}
                value={formData.Mobile}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.Mobile ? 'border-red-500 text-red-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.Mobile && <p className="text-[11px] text-red-500 mt-1">{errors.Mobile}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Landline / Phone
              </label>
              <input
                type="text"
                name="Phone"
                value={formData.Phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.Email ? 'border-red-500 text-red-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.Email && <p className="text-[11px] text-red-500 mt-1">{errors.Email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location / Area
              </label>
              <input
                type="text"
                name="Location"
                value={formData.Location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                name="City"
                value={formData.City}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                name="Pin"
                maxLength={6}
                value={formData.Pin}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.Pin ? 'border-red-500 text-red-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.Pin && <p className="text-[11px] text-red-500 mt-1">{errors.Pin}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                name="Country"
                value={formData.Country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="Address1"
                value={formData.Address1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                name="Address2"
                value={formData.Address2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address Line 3
              </label>
              <input
                type="text"
                name="Address3"
                value={formData.Address3}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Business & Tax Details */}
        <div className="bg-white dark:bg-[#0f1319] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              3. Business & Tax Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Occupation
              </label>
              <input
                type="text"
                name="Occupation"
                value={formData.Occupation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Potential (₹)
              </label>
              <input
                type="number"
                name="Potential"
                min="0"
                step="0.01"
                value={formData.Potential}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.Potential ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.Potential && <p className="text-[11px] text-red-500 mt-1">{errors.Potential}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                name="PANNo"
                maxLength={10}
                value={formData.PANNo}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, PANNo: e.target.value.toUpperCase() }));
                  if (errors.PANNo) setErrors((prev) => ({ ...prev, PANNo: '' }));
                }}
                className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.PANNo ? 'border-red-500 text-red-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.PANNo && <p className="text-[11px] text-red-500 mt-1">{errors.PANNo}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aadhaar Number
              </label>
              <input
                type="text"
                name="Aadhaar"
                maxLength={12}
                value={formData.Aadhaar}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.Aadhaar ? 'border-red-500 text-red-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.Aadhaar && <p className="text-[11px] text-red-500 mt-1">{errors.Aadhaar}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GST Number
              </label>
              <input
                type="text"
                name="GSTNo"
                maxLength={15}
                value={formData.GSTNo}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, GSTNo: e.target.value.toUpperCase() }));
                  if (errors.GSTNo) setErrors((prev) => ({ ...prev, GSTNo: '' }));
                }}
                className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.GSTNo ? 'border-red-500 text-red-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.GSTNo && <p className="text-[11px] text-red-500 mt-1">{errors.GSTNo}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 4: Jewelry Preferences & Remarks */}
        <div className="bg-white dark:bg-[#0f1319] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              4. Jewelry Preferences & Remarks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jewelry Knowledge / Interest
              </label>
              <input
                type="text"
                name="JewKnow"
                value={formData.JewKnow}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ring Size
              </label>
              <input
                type="text"
                name="RingSize"
                value={formData.RingSize}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bangle Size
              </label>
              <input
                type="text"
                name="BangleSize"
                value={formData.BangleSize}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referred By
              </label>
              <input
                type="text"
                name="RefBy"
                value={formData.RefBy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks & Special Notes
            </label>
            <textarea
              name="Remarks"
              rows={3}
              value={formData.Remarks}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (onBackToList) onBackToList();
              else navigate('/customers');
            }}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Updates...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
