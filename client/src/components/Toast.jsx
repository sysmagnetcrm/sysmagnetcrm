import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

const Toast = ({ toasts = [], remove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-500" />;
      case 'error':
        return <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-500" />;
      default:
        return <Icon icon="mdi:information" className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800';
      case 'error':
        return 'border-red-200 dark:border-red-800';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800';
      default:
        return 'border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`
              px-4 py-3 rounded-xl shadow-lg bg-white dark:bg-brand-black
              border ${getBorderColor(toast.type)}
              backdrop-blur-sm
            `}
          >
            <div className="flex items-start gap-3">
              {getIcon(toast.type)}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-brand-black dark:text-brand-white text-sm">
                  {toast.title}
                </div>
                {toast.message && (
                  <div className="text-xs text-brand-grey mt-1 leading-relaxed">
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-brand-grey/10 transition-colors text-brand-grey"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
