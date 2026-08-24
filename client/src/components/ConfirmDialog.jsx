import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';

const ConfirmDialog = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="drawer-backdrop" onClick={onCancel}></div>
      <div
        className="relative bg-white dark:bg-[#171A21] rounded-[16px] border border-[#E5E7EB] dark:border-[#2B313C] shadow-modal w-full max-w-md p-6 z-50 animate-fade-fast"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-50 dark:bg-red-950/30 text-[#DC2626] dark:text-red-400' : 'bg-orange-50 dark:bg-brand-orange/15 text-[#FF8A1F]'}`}>
            <Icon icon={isDanger ? 'heroicons:exclamation-triangle' : 'heroicons:question-mark-circle'} className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={isDanger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
