/**
 * RUDRA SILVER ERP - Formatting Utilities
 * Standardized decimal precision for Indian Rupee currency and Jewellery metal weights.
 */

export function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
}

export function formatWeight(val: number | string | null | undefined, decimals = 3): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.000 g';
  return `${Number(val).toFixed(decimals)} g`;
}

export function formatDate(val: string | Date | null | undefined): string {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
