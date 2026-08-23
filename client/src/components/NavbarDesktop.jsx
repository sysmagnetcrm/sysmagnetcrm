import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const NavbarDesktop = ({ onSearch, user, onToggleProfile }) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="hidden lg:block sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-brand-black/80 border-b border-brand-grey/10"
    >
      <div className="mx-auto flex items-center justify-between px-8 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-grey font-bold">Sysdevcode CRM</p>
          <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white">Welcome back, {user?.name || 'Admin'}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Icon icon="mdi:magnify" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-grey" />
            <input
              type="search"
              placeholder="Quick search (Ctrl + K)"
              onClick={onSearch}
              className="w-72 rounded-xl border border-brand-grey/10 bg-white/60 py-2.5 pl-11 pr-4 text-sm font-medium text-brand-black shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30 dark:bg-[#1e1e1e]/60 dark:text-brand-white"
            />
          </div>

          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-grey/10 bg-white/70 text-brand-grey shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:text-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/40 dark:bg-[#1e1e1e]/60 dark:text-brand-grey dark:hover:text-brand-white"
            aria-label="View notifications"
          >
            <Icon icon="mdi:bell-outline" className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white shadow-sm">3</span>
          </button>

          <button
            type="button"
            onClick={onToggleProfile}
            className="flex items-center gap-3 rounded-xl border border-brand-grey/10 bg-white/70 px-3 py-1.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/40 dark:bg-[#1e1e1e]/60"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white shadow-md">
              {user?.name ? user.name.charAt(0) : 'A'}
            </span>
            <div className="pr-2">
              <p className="text-sm font-bold text-brand-black dark:text-brand-white">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-brand-grey font-medium">{user?.role || 'Administrator'}</p>
            </div>
            <Icon icon="mdi:chevron-down" className="h-4 w-4 text-brand-grey" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default NavbarDesktop;
