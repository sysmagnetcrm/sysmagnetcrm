import { useEffect, useState } from 'react';
import { featuresAPI } from '../utils/supabaseServices';

export const useFeatures = () => {
  const [flags, setFlags] = useState({ sales: true, tickets: true, reports: true, automation: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFlags = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await featuresAPI.get();
      setFlags({
        sales: res.data?.sales !== false,
        tickets: res.data?.tickets !== false,
        reports: res.data?.reports !== false,
        automation: res.data?.automation !== false,
      });
    } catch (e) {
      // Keep defaults (all true) if endpoint not available
      setError('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlags(); }, []);

  return { ...flags, loading, error, refetch: fetchFlags };
};
