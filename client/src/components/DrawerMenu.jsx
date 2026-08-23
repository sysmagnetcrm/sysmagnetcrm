import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { Icon } from '@iconify/react';

const navItems = [
  { label: 'Dashboard', icon: 'mdi:view-dashboard-outline', key: 'dashboard' },
  { label: 'Leads', icon: 'mdi:account-box-outline', key: 'leads' },
  { label: 'Clients', icon: 'mdi:account-group-outline', key: 'clients' },
  { label: 'Invoices', icon: 'mdi:file-document-outline', key: 'payments' },
  { label: 'Tasks', icon: 'mdi:calendar-clock', key: 'tasks' },
  { label: 'Reports', icon: 'mdi:chart-bar', key: 'reports' },
  { label: 'Settings', icon: 'mdi:cog-outline', key: 'settings' },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.25,
      ease: 'easeInOut',
    },
  },
};

const DrawerMenu = ({ isOpen, onClose, current, onNavigate }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={onClose}
          />

          <motion.aside
            className="absolute inset-y-0 right-0 z-10 w-[85%] max-w-xs bg-white dark:bg-brand-black shadow-2xl border-l border-brand-grey/10 flex flex-col"
            variants={drawerVariants}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-brand-grey/10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-grey font-bold">Sysdevcode</p>
                <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">Navigation</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-brand-grey hover:bg-brand-grey/10 transition-colors"
                aria-label="Close navigation drawer"
              >
                <Icon icon="mdi:close" className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = current === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onNavigate?.(item.key);
                      onClose?.();
                    }}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200',
                      isActive
                        ? 'bg-brand-orange text-white shadow-md'
                        : 'text-brand-grey hover:bg-brand-grey/5 hover:text-brand-black dark:hover:text-brand-white'
                    )}
                  >
                    <Icon icon={item.icon} className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="px-6 py-6 border-t border-brand-grey/10">
              <div className="rounded-2xl bg-gradient-to-br from-brand-black to-gray-800 p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Icon icon="mdi:crown" className="w-24 h-24 text-white" />
                </div>
                <h3 className="text-base font-bold relative z-10">Upgrade Plan</h3>
                <p className="mt-2 text-sm text-gray-300 relative z-10">Unlock advanced analytics and automation workflows.</p>
                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-white/20 py-2 text-sm font-bold text-white transition hover:bg-white/30 relative z-10 backdrop-blur-sm"
                >
                  See Pricing
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DrawerMenu;
