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
  ariaLabel = 'Close drawer',
}) => {
  // ESC key handler
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
      {/* Overlay Backdrop - Covers entire viewport */}
      <div
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel - Attached exactly to top:0, right:0, bottom:0 with 560px width */}
      <div className="relative bg-white w-full sm:w-[560px] h-screen flex flex-col z-50 animate-fade-fast border-l border-[#E4E7EC] shadow-modal rounded-none">
        {/* Fixed Header (76px Height) */}
        <div className="h-[76px] px-6 border-b border-[#E4E7EC] bg-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[18px] font-semibold text-[#111827] leading-snug">{title}</h3>
            {subtitle && <p className="text-[13px] text-[#667085] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#FF8A1F]/30 transition-colors"
            aria-label={ariaLabel}
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body (Only Body Scrolls) */}
        <form onSubmit={onSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-7">
            {children}
          </div>

          {/* Sticky Fixed Footer (72px Height) */}
          <div className="h-[72px] px-6 border-t border-[#E4E7EC] bg-white flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary h-[42px] w-[100px] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary h-[42px] w-[140px] sm:w-[160px] text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
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
