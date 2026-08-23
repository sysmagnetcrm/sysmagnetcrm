import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../utils/supabaseServices';
import { Icon } from '@iconify/react';

function MetricCard({ title, value, icon, color }) {
  return (
    <div className="soft-card p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon icon={icon} className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <div className="text-xs font-bold text-brand-grey uppercase tracking-wider">{title}</div>
        <div className="mt-1 text-2xl font-bold text-brand-black dark:text-brand-white">{value}</div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState({ closedDeals: 0, revenue: 0, followups: 0 });
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [mRes, lRes] = await Promise.all([
        reportsAPI.getDashboardMetrics({ period }),
        reportsAPI.getLeaderboard({ period })
      ]);
      setMetrics(mRes.data || { closedDeals: 0, revenue: 0, followups: 0 });
      setLeaders(lRes.data?.data || []);
    } catch (e) {
      setError(e?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Leaderboard</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/5 px-3 py-2 rounded-xl border border-brand-grey/10">
            <Icon icon="mdi:calendar-range" className="text-brand-grey w-4 h-4" />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer p-0"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            className="soft-button bg-brand-black text-white dark:bg-brand-white dark:text-brand-black hover:opacity-90 flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Icon icon="mdi:refresh" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Closed Deals"
          value={metrics.closedDeals}
          icon="mdi:check-circle-outline"
          color="bg-green-500"
        />
        <MetricCard
          title="Revenue"
          value={`₹${Number(metrics.revenue || 0).toLocaleString()}`}
          icon="mdi:currency-inr"
          color="bg-blue-500"
        />
        <MetricCard
          title="Follow-ups"
          value={metrics.followups}
          icon="mdi:phone-outline"
          color="bg-purple-500"
        />
      </div>

      <div className="soft-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-brand-grey/5 border-b border-brand-grey/10">
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Rank</th>
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Salesperson</th>
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Closed Won</th>
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-grey/10">
              {loading && leaders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <div className="spinner mx-auto mb-2"></div>
                    <p className="text-brand-grey text-sm">Loading leaderboard...</p>
                  </td>
                </tr>
              ) : leaders.map((row, idx) => (
                <tr key={row.user_id} className="hover:bg-brand-grey/5 transition-colors">
                  <td className="p-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-gray-100 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-brand-grey/10 text-brand-grey'
                      }`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-brand-black dark:text-brand-white">{row.user_name}</td>
                  <td className="p-4 font-medium text-brand-black dark:text-brand-white">{row.closed_won}</td>
                  <td className="p-4 font-bold text-green-600 dark:text-green-400">₹{Number(row.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
              {!leaders.length && !loading && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-brand-grey">
                    <Icon icon="mdi:trophy-broken" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No leaderboard data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
