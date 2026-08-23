import React from 'react';
import { Icon } from '@iconify/react';

const StatCard = ({
  label,
  value,
  icon = 'heroicons:chart-bar',
  iconColor = 'text-[#FF8A1F]',
  iconBg = 'bg-[#FFF4E8]',
  supportingText,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`saas-card p-4 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-gray-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-[6px] ${iconBg} ${iconColor} flex items-center justify-center`}>
          <Icon icon={icon} className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xl font-bold text-[#111827] mt-1.5">{value}</div>
      {supportingText && (
        <p className="text-[11px] text-[#667085] mt-0.5 truncate">{supportingText}</p>
      )}
    </div>
  );
};

export default StatCard;
