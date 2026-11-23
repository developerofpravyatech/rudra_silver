/**
 * RUDRA SILVER ERP - SweetAlert2 Notification & Confirmation Utility
 * Provides standardized alerts matching the white-mode and royal-blue theme.
 */

import Swal, { SweetAlertResult } from 'sweetalert2';

export { Swal };

/**
 * Show Success Alert with OK button
 */
export async function showSuccessAlert(
  message: string = 'Stock added successfully.',
  title: string = 'Success!'
): Promise<SweetAlertResult> {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#2563eb', // Royal Blue
    buttonsStyling: true,
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs',
    },
  });
}

/**
 * Show Error Alert with OK button
 */
export async function showErrorAlert(
  message: string = 'Operation failed. Please try again.',
  title: string = 'Error!'
): Promise<SweetAlertResult> {
  // Guard against exposing raw SQL queries or sensitive server traces
  let sanitized = message;
  if (/SQLSTATE|PDOException|SELECT\s|INSERT\s|UPDATE\s|DELETE\s/i.test(sanitized)) {
    sanitized = 'A database error occurred. Please contact administrator.';
  }

  return Swal.fire({
    title,
    text: sanitized,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ef4444', // Red
    buttonsStyling: true,
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs',
    },
  });
}

/**
 * Show Warning / Form Validation Alert
 */
export async function showValidationAlert(
  message: string = 'Please fill in all required fields.',
  title: string = 'Validation Warning'
): Promise<SweetAlertResult> {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    confirmButtonText: 'OK',
    confirmButtonColor: '#2563eb',
    buttonsStyling: true,
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs',
    },
  });
}

/**
 * Show Delete Confirmation Dialog
 * Returns Promise<SweetAlertResult> with .isConfirmed boolean
 */
export async function showDeleteConfirmDialog(
  message: string = 'This stock record will be deleted.',
  title: string = 'Are you sure?'
): Promise<SweetAlertResult> {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ef4444', // Red delete button
    cancelButtonColor: '#64748b',  // Slate cancel button
    focusCancel: true,
    buttonsStyling: true,
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs',
      cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs',
    },
  });
}
