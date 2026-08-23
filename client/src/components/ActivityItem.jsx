import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const ActivityItem = ({ activity }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'client': return 'mdi:account';
      case 'task': return 'mdi:checkbox-marked-circle-outline';
      case 'candidate': return 'mdi:account-tie';
      case 'interview': return 'mdi:calendar-clock';
      default: return 'mdi:bell-outline';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'client': return 'bg-blue-50 text-blue-600';
      case 'task': return 'bg-orange-50 text-orange-600';
      case 'candidate': return 'bg-green-50 text-green-600';
      case 'interview': return 'bg-purple-50 text-purple-600';
      default: return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-brand-grey/5 transition-colors"
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${getColor(activity.type)}`}>
        <Icon icon={getIcon(activity.type)} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-sm font-medium text-brand-black dark:text-brand-white leading-snug">
          {activity.text}
        </div>
        <div className="text-xs text-brand-grey mt-1 flex items-center gap-1">
          <Icon icon="mdi:clock-outline" className="w-3 h-3" />
          {activity.time}
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityItem;
