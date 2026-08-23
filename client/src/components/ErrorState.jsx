import React from 'react';
import { Icon } from '@iconify/react';

const ErrorState = ({
  title = 'Unable to load data',
  description = 'Something went wrong while retrieving information from the server.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center saas-card bg-white my-4 border-red-200">
      <div className="w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mb-3">
        <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-5">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
          <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
