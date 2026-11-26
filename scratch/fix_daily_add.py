p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\dailyBalance\DailyBalanceAddPage.tsx"
s = open(p).read()

# import
s = s.replace(
    "import { showSuccessAlert, showErrorAlert, showValidationAlert } from '../../utils/alert';",
    "import { showSuccessAlert, showErrorAlert } from '../../utils/alert';",
    1
)

# validate: replace whole validate function
old_validate = '''  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.account_name.trim()) {
      errs.account_name = 'Account Name is required.';
    }

    if (formData.mobile.trim()) {
      const cleanMob = formData.mobile.trim().replace(/\\D/g, '');
      if (cleanMob.length !== 10) {
        errs.mobile = 'Mobile number must be exactly 10 digits.';
      }
    }

    const numericWeights = [
      'gold_fine',
      'silver_fine',
      'diamond_weight',
      'stone_weight',
      'gold_gross_weight',
      'silver_gross_weight',
    ];
    numericWeights.forEach((f) => {
      const val = (formData as any)[f];
      if (val !== '' && val !== null && val !== undefined) {
        const strVal = String(val).trim();
        if (isNaN(Number(strVal))) {
          errs[f] = 'Must be a valid number.';
        } else if (strVal.includes('.')) {
          const dec = strVal.split('.')[1];
          if (dec && dec.length > 3) {
            errs[f] = 'Max 3 decimal places allowed.';
          }
        }
      }
    });

    if (formData.amount !== '' && formData.amount !== null && formData.amount !== undefined) {
      const strVal = String(formData.amount).trim();
      if (isNaN(Number(strVal))) {
        errs.amount = 'Must be a valid number.';
      } else if (strVal.includes('.')) {
        const dec = strVal.split('.')[1];
        if (dec && dec.length > 2) {
          errs.amount = 'Max 2 decimal places allowed.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };'''

new_validate = '''  const validate = (): string | null => {
    const errs: Record<string, string> = {};
    if (!formData.account_name.trim()) {
      errs.account_name = 'This field is required.';
    }

    if (formData.mobile.trim()) {
      const cleanMob = formData.mobile.trim().replace(/\\D/g, '');
      if (cleanMob.length !== 10) {
        errs.mobile = 'Mobile number must be exactly 10 digits.';
      }
    }

    setErrors(errs);
    const firstInvalid = Object.keys(errs)[0] || null;
    if (firstInvalid) {
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstInvalid}"]`) as HTMLElement | null;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
    return firstInvalid;
  };'''

assert old_validate in s
s = s.replace(old_validate, new_validate, 1)

# handleSubmit
s = s.replace(
    '''    if (!validate()) {
      showValidationAlert('Please fill in all required fields and correct the highlighted errors.', 'Validation Warning');
      return;
    }''',
    '''    if (validate()) {
      return;
    }''',
    1
)

# account_name input: add name, red border, onBlur, error message already there
s = s.replace(
    '''                  <input
                    type="text"
                    value={formData.account_name}
                    onChange={(e) => handleChange('account_name', e.target.value)}
                    placeholder="e.g. ASHAPURA JEWELLERS"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
                  />
                  {errors.account_name && <p className="text-[11px] text-red-500 mt-0.5">{errors.account_name}</p>}''',
    '''                  <input
                    type="text"
                    name="account_name"
                    value={formData.account_name}
                    onChange={(e) => handleChange('account_name', e.target.value)}
                    onBlur={() => {
                      if (!formData.account_name.trim()) {
                        setErrors((prev) => ({ ...prev, account_name: 'This field is required.' }));
                      }
                    }}
                    placeholder="e.g. ASHAPURA JEWELLERS"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-500 uppercase font-semibold ${errors.account_name ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {errors.account_name && <p className="text-[11px] text-red-500 mt-0.5">{errors.account_name}</p>}''',
    1
)

open(p, "w").write(s)
print("done")
PY