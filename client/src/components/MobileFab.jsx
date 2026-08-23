import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const MobileFab = ({ onPrimary, label = 'Quick Add' }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onPrimary}
      className="lg:hidden fixed bottom-20 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange text-white shadow-lg shadow-brand-orange/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
      aria-label={label}
    >
      <Icon icon="mdi:plus" className="h-8 w-8" />
    </motion.button>
  );
};

export default MobileFab;
