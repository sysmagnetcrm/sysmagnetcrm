import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import clsx from 'clsx';

const NavbarMobile = ({ onMenu, onSearch, theme = 'light', onToggleTheme, user }) => {
  return (
    <header className="sticky top-0 z-40 lg:hidden">
      <div className="bg-white/90 dark:bg-brand-black/90 backdrop-blur-xl border-b border-brand-grey/10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-grey/10 bg-white/70 dark:bg-[#1e1e1e]/70 text-brand-grey dark:text-brand-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 hover:bg-brand-grey/5"
              aria-label="Open navigation drawer"
            >
              <Icon icon="mdi:menu" className="h-6 w-6" />
            </button>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-brand-grey font-bold">Sysdevcode</p>
              <h1 className="text-sm font-bold text-brand-black dark:text-brand-white truncate max-w-[120px]">Hi, {user?.name || 'Admin'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSearch}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-grey/5 text-brand-grey dark:bg-brand-grey/10 dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 hover:bg-brand-grey/10"
              aria-label="Open quick search"
            >
              <Icon icon="mdi:magnify" className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-grey/5 text-brand-grey dark:bg-brand-grey/10 dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 hover:bg-brand-grey/10"
              aria-label="View notifications"
            >
              <Icon icon="mdi:bell-outline" className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">3</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className={clsx(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition hover:bg-brand-grey/10',
                'bg-brand-grey/5 text-brand-grey dark:bg-brand-grey/10 dark:text-brand-white'
              )}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon icon="mdi:weather-night" className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon icon="mdi:weather-sunny" className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavbarMobile;
