import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';

const FormDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  submitLabel = 'Save',
  submitting = false,
  onSubmit,
  maxWidth = 'max-w-xl', // 576px default (520-640px range)
}) => {
  // ESC key handler & focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Subtle Overlay Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className={`relative bg-white w-full ${maxWidth} h-full shadow-modal flex flex-col z-50 animate-fade-fast border-l border-[#E4E7EC]`}>
        {/* Fixed Header */}
        <div className="px-6 py-4 border-b border-[#E4E7EC] flex items-center justify-between shrink-0 bg-white">
          <div>
            <h3 className="text-base font-bold text-[#111827]">{title}</h3>
            {subtitle && <p className="text-xs text-[#667085] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] rounded-[6px] transition-colors"
            aria-label="Close drawer"
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {children}
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-4 border-t border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary min-w-[100px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary min-w-[140px] flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{submitLabel}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormDrawer;
