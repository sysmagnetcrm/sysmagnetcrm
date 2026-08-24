import React from 'react';
import { Icon } from '@iconify/react';

const EmptyState = ({
  icon = 'heroicons:inbox',
  title = 'No data available',
  description = 'There are no records to display at the moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center saas-card bg-white dark:bg-[#171A21] my-4 border border-[#E4E7EC] dark:border-[#2B313C]">
      <div className="w-10 h-10 rounded-full bg-[#FFF4E8] dark:bg-brand-orange/15 text-[#FF8A1F] flex items-center justify-center mb-2.5">
        <Icon icon={icon} className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-[#111827] dark:text-white mb-0.5">{title}</h3>
      <p className="text-xs text-[#667085] dark:text-gray-400 max-w-xs mb-4">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary text-xs py-1.5 px-3">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
