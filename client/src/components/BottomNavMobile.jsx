import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import clsx from 'clsx';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard-outline' },
  { key: 'leads', label: 'Leads', icon: 'mdi:account-box-outline' },
  { key: 'clients', label: 'Clients', icon: 'mdi:account-group-outline' },
  { key: 'payments', label: 'Invoices', icon: 'mdi:file-document-outline' },
  { key: 'settings', label: 'Settings', icon: 'mdi:cog-outline' },
];

const BottomNavMobile = ({ current, onNavigate }) => {
  return (
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-brand-grey/10 bg-white/95 backdrop-blur-xl dark:bg-brand-black/95 pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = current === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate?.(item.key)}
              className={clsx(
                'group relative flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition-all duration-200',
                isActive ? 'text-[#FE911E]' : 'text-brand-grey hover:text-brand-black dark:hover:text-brand-white'
              )}
            >
              <motion.span
                className={clsx(
                  'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-[#FE911E]/10 text-[#FE911E] shadow-sm'
                    : 'bg-transparent'
                )}
                whileTap={{ scale: 0.94 }}
              >
                <Icon icon={item.icon} className="h-5 w-5" />
              </motion.span>
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 w-8 h-0.5 bg-[#FE911E] rounded-b-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavMobile;
