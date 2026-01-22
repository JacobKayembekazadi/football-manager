/**
 * ConfirmationDialog Component
 *
 * A reusable modal dialog for confirming destructive actions like delete, remove, etc.
 * Provides a consistent UX for all confirmation prompts across the app.
 */

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'text-red-500',
    iconBg: 'bg-red-500/10 border-red-500/30',
    button: 'bg-red-500 hover:bg-red-600 text-white',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  },
  warning: {
    icon: 'text-amber-500',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    button: 'bg-amber-500 hover:bg-amber-600 text-black',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  },
  info: {
    icon: 'text-blue-500',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  },
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
        {/* Top gradient line */}
        <div
          className={`absolute top-0 left-0 w-full h-1 ${
            variant === 'danger'
              ? 'bg-gradient-to-r from-red-500 to-orange-500'
              : variant === 'warning'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}
          aria-hidden="true"
        />

        {/* Close button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} border flex items-center justify-center`}
              aria-hidden="true"
            >
              <AlertTriangle className={styles.icon} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirmation-title"
                className="text-lg font-display font-bold text-white"
              >
                {title}
              </h3>
              <p
                id="confirmation-message"
                className="mt-1 text-sm text-slate-400 leading-relaxed"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles.button} hover:${styles.glow}`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
