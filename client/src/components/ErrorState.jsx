import React from 'react';
import { Icon } from '@iconify/react';

const ErrorState = ({
  title = 'Unable to load data',
  description = 'Something went wrong while retrieving information from the server.',
  referenceId,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center saas-card bg-white my-4 border border-[#FECDCA]">
      <div className="w-10 h-10 rounded-full bg-[#FEF3F2] text-[#D92D20] flex items-center justify-center mb-2.5">
        <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#111827] mb-0.5">{title}</h3>
      <p className="text-xs text-[#667085] max-w-sm mb-2">{description}</p>
      {referenceId && (
        <span className="text-[10px] font-mono text-[#667085] mb-3 px-2 py-0.5 bg-[#F9FAFB] border border-[#EAECF0] rounded">
          Ref: {referenceId}
        </span>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="saas-button-secondary h-8 px-3 text-xs font-semibold flex items-center gap-1.5 mt-1"
        >
          <Icon icon="heroicons:arrow-path" className="w-3.5 h-3.5 text-[#667085]" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
