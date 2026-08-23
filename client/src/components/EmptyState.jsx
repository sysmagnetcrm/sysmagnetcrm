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
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center saas-card bg-white my-4">
      <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF8A1F] flex items-center justify-center mb-3">
        <Icon icon={icon} className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
