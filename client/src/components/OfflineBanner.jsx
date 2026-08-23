import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-[#FEF3F2] border-b border-[#FECDCA] px-4 py-2.5 text-xs text-[#B42318] flex items-center justify-center gap-2 font-medium z-50 animate-fade-fast">
      <Icon icon="heroicons:wifi" className="w-4 h-4 text-[#D92D20] shrink-0" />
      <span>You're offline. Some CRM actions and live updates may be temporarily unavailable.</span>
    </div>
  );
};

export default OfflineBanner;
