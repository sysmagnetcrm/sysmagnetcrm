import { useEffect, useState } from 'react';
import { reportsAPI } from '../utils/supabaseServices';
import { useFeatures } from './useFeatures';

export const useReports = () => {
  const [summary, setSummary] = useState({ totalLeads: 0, closedSales: 0, totalRevenue: 0, pendingRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { reports } = useFeatures();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!reports) {
        setSummary({ totalLeads: 0, closedSales: 0, totalRevenue: 0, pendingRevenue: 0 });
        return;
      }
      const res = await reportsAPI.getSummary();
      setSummary(res.data);
    } catch (e) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [reports]);

  return { summary, loading, error, refetch: fetchSummary };
};
