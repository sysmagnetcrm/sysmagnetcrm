import React, { useEffect, useState } from 'react';
import { adminClientTasksAPI } from '../utils/supabaseServices';
import { Icon } from '@iconify/react';

const AdminClientLogs = () => {
  const [logs, setLogs] = useState([]);
  const [limit, setLimit] = useState(100);
  const [role, setRole] = useState('all'); // client|staff|admin|all
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await adminClientTasksAPI.logs(limit);
      let rows = resp.data || [];
      if (role !== 'all') rows = rows.filter(r => (r.actor_role || '').toLowerCase() === role);
      if (q) {
        const term = q.toLowerCase();
        rows = rows.filter(r => (r.message || '').toLowerCase().includes(term) || (r.title || '').toLowerCase().includes(term));
      }
      setLogs(rows);
    } catch (e) {
      console.error('Failed to load logs', e?.response?.data || e?.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); /* reload when filters/limit change */ }, [limit, role, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey w-5 h-5" />
          <input
            placeholder="Search message/title..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="soft-input w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/5 px-3 py-2 rounded-xl border border-brand-grey/10">
            <Icon icon="mdi:filter-variant" className="text-brand-grey w-4 h-4" />
            <span className="text-xs font-bold text-brand-grey uppercase">Role</span>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer p-0"
            >
              {['all', 'client', 'staff', 'admin'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/5 px-3 py-2 rounded-xl border border-brand-grey/10">
            <Icon icon="mdi:format-list-numbered" className="text-brand-grey w-4 h-4" />
            <span className="text-xs font-bold text-brand-grey uppercase">Limit</span>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer p-0"
            >
              {[50, 100, 200, 300, 500].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="soft-card overflow-hidden">
        {/* Table header for md+ */}
        <div className="hidden md:grid md:grid-cols-12 text-xs font-bold text-brand-grey uppercase tracking-wider bg-brand-grey/5 p-4 border-b border-brand-grey/10">
          <div className="md:col-span-2">Time</div>
          <div className="md:col-span-1">Role</div>
          <div className="md:col-span-4">Message</div>
          <div className="md:col-span-5">Task Title</div>
        </div>

        <div className="divide-y divide-brand-grey/10 max-h-[600px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center">
              <div className="spinner mx-auto mb-2"></div>
              <p className="text-brand-grey text-sm">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center text-brand-grey">
              <Icon icon="mdi:file-document-outline" className="w-12 h-12 mb-2 opacity-50" />
              <p>No logs found matching your criteria</p>
            </div>
          ) : logs.map(l => (
            <div key={l.id} className="group hover:bg-brand-grey/5 transition-colors">
              {/* Desktop row */}
              <div className="hidden md:grid md:grid-cols-12 text-sm p-4 items-center gap-4">
                <div className="md:col-span-2 text-brand-grey text-xs font-mono">
                  {new Date(l.created_at).toLocaleString()}
                </div>
                <div className="md:col-span-1">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${l.actor_role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      l.actor_role === 'staff' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                    }`}>
                    {l.actor_role}
                  </span>
                </div>
                <div className="md:col-span-4 text-brand-black dark:text-brand-white truncate" title={l.message}>
                  {l.message}
                </div>
                <div className="md:col-span-5 text-brand-grey truncate flex items-center gap-2" title={l.title}>
                  <Icon icon="mdi:checkbox-marked-circle-outline" className="w-4 h-4 flex-shrink-0 opacity-50" />
                  {l.title}
                </div>
              </div>
              {/* Mobile card */}
              <div className="md:hidden p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-mono text-brand-grey">{new Date(l.created_at).toLocaleString()}</div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${l.actor_role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      l.actor_role === 'staff' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                    }`}>
                    {l.actor_role}
                  </span>
                </div>
                <div className="text-sm font-medium text-brand-black dark:text-brand-white break-words">{l.message}</div>
                <div className="text-xs text-brand-grey flex items-center gap-1 break-words bg-brand-grey/5 p-2 rounded-lg">
                  <Icon icon="mdi:checkbox-marked-circle-outline" className="w-3.5 h-3.5 flex-shrink-0" />
                  {l.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminClientLogs;
