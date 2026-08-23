import { useState, useEffect } from 'react';
import { dashboardAPI } from '../utils/supabaseServices';

export const useDashboard = (range = 'month') => {
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingTasks: 0,
    approvedCandidates: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getStats({ range });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};