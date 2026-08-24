import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import clsx from 'clsx';

const navigation = [
  { label: 'Dashboard', icon: 'mdi:view-dashboard-outline', key: 'dashboard' },
  { label: 'Leads', icon: 'mdi:account-box-outline', key: 'leads' },
  { label: 'Clients', icon: 'mdi:account-group-outline', key: 'clients' },
  { label: 'Invoices', icon: 'mdi:file-document-outline', key: 'payments' },
  { label: 'Tasks', icon: 'mdi:calendar-clock', key: 'tasks' },
  { label: 'Reports', icon: 'mdi:chart-bar', key: 'reports' },
  { label: 'Settings', icon: 'mdi:cog-outline', key: 'settings' },
];

const SidebarDesktop = ({ current, onNavigate }) => {
  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 bg-white dark:bg-[#14171D] backdrop-blur-xl border-r border-[#E4E7EC] dark:border-[#2B313C] text-[#101828] dark:text-white"
    >
      <div className="px-6 py-5 border-b border-[#E4E7EC] dark:border-[#2B313C]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#667085] dark:text-gray-400 font-bold">Sysdevcode CRM</p>
        <h1 className="mt-2 text-2xl font-bold text-[#101828] dark:text-white">Control Center</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = current === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate?.(item.key)}
              className={clsx(
                'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200',
                'hover:bg-brand-grey/5 focus:outline-none focus:ring-2 focus:ring-[#FE911E]/50',
                isActive
                  ? 'bg-[#FE911E] text-white shadow-md'
                  : 'text-brand-grey hover:text-brand-black dark:hover:text-brand-white'
              )}
            >
              <Icon
                icon={item.icon}
                className={clsx('h-5 w-5 transition-transform duration-200', {
                  'scale-110': isActive,
                })}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-brand-grey/10">
        <div className="rounded-2xl bg-gradient-to-br from-brand-black to-gray-800 p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Icon icon="mdi:rocket-launch" className="w-24 h-24 text-white" />
          </div>
          <p className="text-xs text-gray-300 relative z-10">Need more firepower?</p>
          <h2 className="text-lg font-bold relative z-10">Upgrade to Pro</h2>
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-white/20 py-2 text-sm font-bold text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 relative z-10 backdrop-blur-sm"
          >
            View Plans
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default SidebarDesktop;
