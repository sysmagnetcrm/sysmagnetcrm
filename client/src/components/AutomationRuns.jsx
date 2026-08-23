import React, { useEffect, useState } from 'react';
import { automationAPI } from '../utils/supabaseServices';
import { Icon } from '@iconify/react';
import { useFeatures } from '../hooks/useFeatures';

function AutomationRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);
  const { automation, loading: flagsLoading } = useFeatures();

  const fetchRuns = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await automationAPI.getRuns({ limit });
      setRuns(res.data?.items || []);
    } catch (e) {
      setError(e?.message || 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (automation) fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, automation]);

  if (!automation && !flagsLoading) {
    return (
      <div className="soft-card p-6">
        <div className="flex items-center gap-2 text-brand-grey">
          <Icon icon="mdi:robot-off-outline" className="w-5 h-5" />
          <span className="text-sm font-medium">Automation module is disabled.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Automation Runs</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/5 px-3 py-2 rounded-xl border border-brand-grey/10">
            <span className="text-xs font-bold text-brand-grey uppercase">Limit</span>
            <select
              value={limit}
              onChange={e => setLimit(parseInt(e.target.value, 10))}
              className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer p-0"
            >
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button
            onClick={fetchRuns}
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

      <div className="soft-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-brand-grey/5 border-b border-brand-grey/10">
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">#</th>
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Name</th>
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Started</th>
                <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Finished</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-grey/10">
              {loading && runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="spinner mx-auto mb-2"></div>
                    <p className="text-brand-grey text-sm">Loading runs...</p>
                  </td>
                </tr>
              ) : runs.map(r => (
                <tr key={r.id} className="hover:bg-brand-grey/5 transition-colors">
                  <td className="p-4 font-mono text-brand-grey text-xs">{r.id}</td>
                  <td className="p-4">
                    <div className="font-mono text-xs text-brand-black dark:text-brand-white truncate max-w-[240px] bg-brand-grey/5 px-2 py-1 rounded" title={r.name}>
                      {r.name}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${r.status === 'success' ? 'bg-green-100 text-green-700' :
                        r.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                      }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-brand-grey text-xs">{r.started_at ? new Date(r.started_at).toLocaleString() : '-'}</td>
                  <td className="p-4 text-brand-grey text-xs">{r.finished_at ? new Date(r.finished_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!runs.length && !loading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-brand-grey">
                    <Icon icon="mdi:robot-off-outline" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No automation runs found
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

export default AutomationRuns;
