import toast from 'react-hot-toast';

/**
 * Toast utility that prevents duplicate toast notifications
 * Each toast type uses a unique ID to replace existing toasts of the same type
 */

// Store the last toast ID for each category
const toastIds = {
    success: 'global-success',
    error: 'global-error',
    loading: 'global-loading',
    info: 'global-info',
};

/**
 * Show a success toast - only one at a time
 */
export const showSuccess = (message, options = {}) => {
    const id = options.id || toastIds.success;
    return toast.success(message, { ...options, id });
};

/**
 * Show an error toast - only one at a time
 */
export const showError = (message, options = {}) => {
    const id = options.id || toastIds.error;
    return toast.error(message, { ...options, id });
};

/**
 * Show a loading toast - only one at a time
 */
export const showLoading = (message, options = {}) => {
    const id = options.id || toastIds.loading;
    return toast.loading(message, { ...options, id });
};

/**
 * Show an info toast - only one at a time
 */
export const showInfo = (message, options = {}) => {
    const id = options.id || toastIds.info;
    return toast(message, { ...options, id });
};

/**
 * Dismiss a specific toast or all toasts
 */
export const dismissToast = (id) => {
    if (id) {
        toast.dismiss(id);
    } else {
        toast.dismiss();
    }
};

/**
 * Custom toast with any icon
 */
export const showCustom = (message, options = {}) => {
    const id = options.id || 'global-custom';
    return toast(message, { ...options, id });
};

// Export original toast for special cases
export { toast };

// Default export with all methods
const toastUtils = {
    success: showSuccess,
    error: showError,
    loading: showLoading,
    info: showInfo,
    dismiss: dismissToast,
    custom: showCustom,
    // Access original toast
    raw: toast,
};

export default toastUtils;