import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { checkApiStatus, isSupabasePaused } from '../utils/apiStatus';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dbPaused, setDbPaused] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const checkInterval = setInterval(async () => {
      if (navigator.onLine) {
        await checkApiStatus();
        setDbPaused(isSupabasePaused());
      }
    }, 45000);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearInterval(checkInterval);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="bg-[#FEF3F2] border-b border-[#FECDCA] px-4 py-2.5 text-xs text-[#B42318] flex items-center justify-center gap-2 font-medium z-50 animate-fade-fast">
        <Icon icon="heroicons:wifi" className="w-4 h-4 text-[#D92D20] shrink-0" />
        <span>You're offline. Some CRM actions and live updates may be temporarily unavailable.</span>
      </div>
    );
  }

  if (dbPaused) {
    return (
      <div className="bg-[#FFFAEB] border-b border-[#FEDF89] px-4 py-2.5 text-xs text-[#B54708] flex items-center justify-center gap-2 font-medium z-50 animate-fade-fast">
        <Icon icon="heroicons:circle-stack" className="w-4 h-4 text-[#D97706] shrink-0" />
        <span>Database is currently in pause / maintenance mode. Pinging to wake up...</span>
      </div>
    );
  }

  return null;
};

export default OfflineBanner;
