import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

const Toast = ({ toasts = [], remove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <Icon icon="heroicons:check-circle" className="w-5 h-5 text-[#12B76A]" />;
      case 'error':
        return <Icon icon="heroicons:exclamation-circle" className="w-5 h-5 text-[#D92D20]" />;
      case 'warning':
        return <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-[#F79009]" />;
      default:
        return <Icon icon="heroicons:information-circle" className="w-5 h-5 text-[#175CD3]" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-[#ABEFC6] bg-[#ECFDF3]';
      case 'error':
        return 'border-[#FECDCA] bg-[#FEF3F2]';
      case 'warning':
        return 'border-[#FEDF89] bg-[#FFFAEB]';
      default:
        return 'border-[#BDD6FF] bg-[#F0F5FF]';
    }
  };

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`
              p-3.5 rounded-[10px] shadow-lg bg-white dark:bg-[#171A21] border ${getBorderColor(toast.type)}
              pointer-events-auto transition-all
            `}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#101828] dark:text-white text-xs">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-[11px] text-[#475467] dark:text-gray-300 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
                {toast.referenceId && (
                  <p className="text-[10px] font-mono text-[#667085] dark:text-gray-400 mt-1">
                    Ref: {toast.referenceId}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="shrink-0 p-1 rounded hover:bg-black/5 text-[#667085] transition-colors"
                aria-label="Dismiss toast"
              >
                <Icon icon="heroicons:x-mark" className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
