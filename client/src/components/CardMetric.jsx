import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import clsx from 'clsx';

const accentPalettes = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    icon: 'text-blue-600 dark:text-blue-400',
    trend: 'text-blue-600 bg-blue-100',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    trend: 'text-emerald-600 bg-emerald-100',
  },
  orange: {
    bg: 'bg-brand-orange/5 dark:bg-brand-orange/10',
    icon: 'text-brand-orange',
    trend: 'text-brand-orange bg-brand-orange/10',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    icon: 'text-purple-600 dark:text-purple-400',
    trend: 'text-purple-600 bg-purple-100',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/10',
    icon: 'text-rose-600 dark:text-rose-400',
    trend: 'text-rose-600 bg-rose-100',
  },
};

const CardMetric = ({
  title,
  value,
  change,
  caption,
  icon,
  accent = 'blue',
}) => {
  const palette = accentPalettes[accent] ?? accentPalettes.blue;
  const isPositive = typeof change === 'string' ? change.trim().startsWith('+') : change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="soft-card p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={clsx('p-3 rounded-full transition-colors', palette.bg, palette.icon)}>
          <Icon icon={icon || 'mdi:circle-small'} className="w-6 h-6" />
        </div>

        {change && (
          <div className={clsx(
            'flex items-center px-2 py-1 rounded-full text-xs font-bold',
            isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {change}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-3xl font-bold text-brand-black dark:text-brand-white mb-1">
          {value}
        </div>
        <div className="text-sm font-medium text-brand-grey">
          {title}
        </div>
      </div>

      {caption && (
        <div className="mt-4 pt-4 border-t border-brand-grey/10 text-xs text-brand-grey">
          {caption}
        </div>
      )}
    </motion.div>
  );
};

export default CardMetric;
