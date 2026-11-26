/**
 * Shared form validation helpers for Rudra Silver ERP.
 * Keeps field-level validation consistent across all modules.
 */

export type FieldErrors = Record<string, string>;

export function isBlank(val: unknown): boolean {
  return String(val ?? '').trim().length === 0;
}

export function reqText(val: unknown, label: string, minLen = 1, maxLen = 255): string | null {
  const s = String(val ?? '').trim();
  if (!s) return `${label} is required.`;
  if (s.length < minLen) return `${label} must be at least ${minLen} characters.`;
  if (s.length > maxLen) return `${label} must not exceed ${maxLen} characters.`;
  return null;
}

export function reqSelect(val: unknown, label: string): string | null {
  if (val === null || val === undefined || val === '' || val === 0 || val === '0') {
    return `Please select ${label}.`;
  }
  return null;
}

export function reqDate(val: unknown, label: string): string | null {
  const s = String(val ?? '').trim();
  if (!s) return `${label} is required.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${label} must be a valid date (YYYY-MM-DD).`;
  return null;
}

export function reqPositiveNum(val: unknown, label: string): string | null {
  const n = Number(val);
  if (val === '' || val === null || val === undefined || Number.isNaN(n)) {
    return `${label} is required.`;
  }
  if (n <= 0) return `${label} must be greater than 0.`;
  return null;
}

export function nonNegNum(val: unknown, label: string): string | null {
  if (val === '' || val === null || val === undefined) return null;
  const n = Number(val);
  if (Number.isNaN(n) || n < 0) return `${label} must be 0 or greater.`;
  return null;
}

export function optMobile(val: unknown, label = 'Mobile number'): string | null {
  const s = String(val ?? '').trim();
  if (!s) return null;
  if (!/^\d{10}$/.test(s)) return `Please enter a valid 10-digit ${label.toLowerCase()}.`;
  return null;
}

export function reqMobile(val: unknown, label = 'Mobile number'): string | null {
  const s = String(val ?? '').trim();
  if (!s) return `${label} is required.`;
  if (!/^\d{10}$/.test(s)) return `Please enter a valid 10-digit ${label.toLowerCase()}.`;
  return null;
}

export function optEmail(val: unknown, label = 'Email'): string | null {
  const s = String(val ?? '').trim();
  if (!s) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return `Please enter a valid ${label.toLowerCase()}.`;
  return null;
}

export function focusFirstError(containerSelector = 'form'): void {
  setTimeout(() => {
    const el = document.querySelector(`${containerSelector} [data-invalid="true"], ${containerSelector} .border-rose-400, ${containerSelector} .border-red-400`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
    }
  }, 20);
}
