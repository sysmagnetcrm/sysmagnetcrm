import React from 'react';
import { Icon } from '@iconify/react';

const ErrorState = ({
  title = 'Unable to load data',
  description = 'Something went wrong while retrieving information from the server.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center saas-card bg-white my-4 border border-[#FEF3F2]">
      <div className="w-10 h-10 rounded-full bg-[#FEF3F2] text-[#F04438] flex items-center justify-center mb-2.5">
        <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-[#111827] mb-0.5">{title}</h3>
      <p className="text-xs text-[#667085] max-w-xs mb-4">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs py-1.5 px-3">
          <Icon icon="heroicons:arrow-path" className="w-3.5 h-3.5 mr-1.5 text-[#667085]" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
