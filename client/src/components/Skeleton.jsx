import React from 'react';

export const SkeletonRow = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full animate-pulse space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div key={cIdx} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonCard = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="saas-card p-5 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonCard;
