import { useEffect, useState } from 'react';
import { salesAPI } from '../utils/supabaseServices';
import { useFeatures } from './useFeatures';

export const useSales = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { sales } = useFeatures();

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!sales) {
        setDeals([]);
        return;
      }
      const res = await salesAPI.getAll();
      setDeals(res.data);
    } catch (e) {
      setError('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async (deal) => {
    try {
      const res = await salesAPI.create(deal);
      setDeals(prev => [res.data, ...prev]);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateDeal = async (id, patch) => {
    try {
      await salesAPI.update(id, patch);
      setDeals(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const moveDealLocally = (id, newStage) => {
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, stage: newStage } : d)));
  };

  useEffect(() => { fetchDeals(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sales]);

  return { deals, loading, error, refetch: fetchDeals, createDeal, updateDeal, moveDealLocally };
}
