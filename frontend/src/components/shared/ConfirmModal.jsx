import { useState } from 'react';

/**
 * ConfirmModal — Generic confirmation dialog with neobrutalism styling.
 * Slides up from bottom on mobile.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {string} [props.confirmText] — Default "Confirm"
 * @param {string} [props.cancelText] — Default "Cancel"
 * @param {'primary'|'danger'} [props.variant]
 * @param {boolean} [props.isLoading]
 * @param {React.ReactNode} [props.children] — Custom body content
 */
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false,
    children,
}) => {
    if (!isOpen) return null;

    const confirmBtnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm mx-auto p-6 border-t-[2px] sm:border-[2px] border-gigpay-border shadow-brutal animate-slide-up"
                style={{
                    animation: 'slideUp 0.25s ease-out',
                }}
            >
                {/* Title */}
                <h3 className="text-heading-md text-gigpay-text-primary mb-2">
                    {title}
                </h3>

                {/* Message */}
                {message && (
                    <p className="text-body-md text-gigpay-text-secondary mb-5">
                        {message}
                    </p>
                )}

                {/* Custom body */}
                {children && <div className="mb-5">{children}</div>}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn-secondary flex-1"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`${confirmBtnClass} flex-1`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default ConfirmModal;
