import React, { useMemo, useState } from 'react';
import { useClientTasks } from '../hooks/useClientTasks';
import { staffClientTasksAPI } from '../utils/supabaseServices';
import { Icon } from '@iconify/react';

const StaffWorkboard = () => {
  const { tasks, submit, refetch } = useClientTasks('staff');
  const [tab, setTab] = useState('board'); // board | logs
  const [active, setActive] = useState(null);
  const [logMsg, setLogMsg] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [deliverables, setDeliverables] = useState([]);
  const [logs, setLogs] = useState([]);
  const [limit, setLimit] = useState(100);

  const open = (task) => {
    setActive(task);
    setLogMsg('');
    setTimeSpent('');
    setDeliverables([]);
  };

  const addDeliverable = () => {
    const filename = prompt('Enter deliverable filename (metadata only)');
    if (!filename) return;
    setDeliverables((prev) => [...prev, { filename }]);
  };

  const onSubmit = async () => {
    if (!logMsg.trim()) { alert('Log message is required'); return; }
    const res = await submit(active.id, { logs: [{ message: logMsg, time_spent: timeSpent ? Number(timeSpent) : undefined }], attachments: deliverables });
    if (res.success) {
      alert('Submitted for review');
      setActive(null);
      refetch();
    } else {
      alert(res.error || 'Submit failed');
    }
  };

  const groups = useMemo(() => {
    const by = { 'In Progress': [], 'Changes Requested': [], 'Submitted': [], 'New': [], 'Closed': [] };
    tasks.forEach(t => { (by[t.status] = by[t.status] || []).push(t); });
    return by;
  }, [tasks]);

  const loadLogs = async (lim) => {
    try {
      const resp = await staffClientTasksAPI.logs(lim || limit);
      setLogs(resp.data || []);
    } catch (e) {
      console.error('Failed to load staff logs', e?.response?.data || e?.message);
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-brand-grey/10 pb-4">
        <button
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-sm ${tab === 'board' ? 'bg-brand-orange text-white shadow-md' : 'bg-white dark:bg-brand-grey/5 text-brand-grey hover:bg-brand-grey/10'}`}
          onClick={() => setTab('board')}
        >
          <Icon icon="mdi:view-dashboard-outline" className="w-4 h-4" />
          My Workboard
        </button>
        <button
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-sm ${tab === 'logs' ? 'bg-brand-orange text-white shadow-md' : 'bg-white dark:bg-brand-grey/5 text-brand-grey hover:bg-brand-grey/10'}`}
          onClick={() => { setTab('logs'); loadLogs(); }}
        >
          <Icon icon="mdi:history" className="w-4 h-4" />
          My Logs
        </button>
      </div>

      {tab === 'logs' && (
        <div className="space-y-4 soft-card p-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-brand-grey uppercase tracking-wider">Limit</label>
            <select
              value={limit}
              onChange={e => { const v = Number(e.target.value); setLimit(v); loadLogs(v); }}
              className="soft-input py-1 px-2 text-xs w-20"
            >
              {[50, 100, 200, 300, 500].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="rounded-xl overflow-hidden border border-brand-grey/10">
            <div className="grid grid-cols-12 text-xs font-bold bg-brand-grey/5 p-3 text-brand-grey uppercase tracking-wider">
              <div className="col-span-2">Time</div>
              <div className="col-span-7">Message</div>
              <div className="col-span-3">Task</div>
            </div>
            <div className="divide-y divide-brand-grey/10 bg-white dark:bg-brand-black">
              {logs.length === 0 ? (
                <div className="p-8 text-sm text-brand-grey text-center flex flex-col items-center">
                  <Icon icon="mdi:clipboard-text-off-outline" className="w-8 h-8 mb-2 opacity-50" />
                  No logs yet
                </div>
              ) : logs.map(l => (
                <div key={l.id} className="grid grid-cols-12 text-sm p-3 hover:bg-brand-grey/5 transition-colors">
                  <div className="col-span-2 text-brand-grey text-xs font-medium">{new Date(l.created_at).toLocaleString()}</div>
                  <div className="col-span-7 text-brand-black dark:text-brand-white">{l.message}</div>
                  <div className="col-span-3 text-brand-orange font-bold truncate">{l.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {Object.entries(groups).map(([status, list]) => (
            <div key={status} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="font-bold text-brand-black dark:text-brand-white text-sm uppercase tracking-wide">{status}</div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-brand-grey/10 text-brand-grey">
                  {list.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[100px] bg-brand-grey/5 rounded-xl p-2">
                {list.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-brand-grey/30 py-8">
                    <Icon icon="mdi:clipboard-check-outline" className="w-8 h-8 mb-2" />
                    <span className="text-xs font-medium">No tasks</span>
                  </div>
                ) : list.map(t => (
                  <div
                    key={t.id}
                    className={`soft-card p-4 hover:shadow-md transition-all cursor-pointer group ${active?.id === t.id ? 'ring-2 ring-brand-orange' : ''}`}
                    onClick={() => open(t)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-brand-black dark:text-brand-white text-sm line-clamp-2">{t.title}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide whitespace-nowrap ml-2 ${t.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                        t.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-brand-grey/10 text-brand-grey'
                        }`}>
                        {t.priority}
                      </span>
                    </div>
                    <div className="text-xs text-brand-grey line-clamp-2 mb-3">{t.description}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-brand-grey/10">
                      <div className="text-[10px] font-medium text-brand-grey flex items-center gap-1">
                        <Icon icon="mdi:calendar-clock" className="w-3 h-3" />
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date'}
                      </div>
                      <Icon icon="mdi:chevron-right" className="w-4 h-4 text-brand-grey group-hover:text-brand-orange transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'board' && active && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="soft-card p-6 w-full max-w-2xl bg-white dark:bg-brand-black">
            <div className="flex items-center justify-between mb-6 border-b border-brand-grey/10 pb-4">
              <div>
                <div className="text-xs font-bold text-brand-grey uppercase tracking-wider">Submit Work</div>
                <div className="text-xl font-bold text-brand-black dark:text-brand-white mt-1">{active.title}</div>
              </div>
              <button onClick={() => setActive(null)} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey transition-colors">
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Log message (required)</label>
                <textarea
                  className="soft-input w-full resize-none"
                  rows={3}
                  value={logMsg}
                  onChange={e => setLogMsg(e.target.value)}
                  placeholder="Describe what you did..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Time spent (minutes, optional)</label>
                <input
                  type="number"
                  className="soft-input w-full"
                  value={timeSpent}
                  onChange={e => setTimeSpent(e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Deliverables (metadata only)</label>
                <div className="space-y-2 mb-2">
                  {deliverables.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-brand-black dark:text-brand-white bg-brand-grey/5 p-2 rounded-lg border border-brand-grey/10">
                      <Icon icon="mdi:file-check-outline" className="w-4 h-4 text-brand-orange" />
                      {d.filename}
                    </div>
                  ))}
                  {deliverables.length === 0 && <div className="text-sm text-brand-grey italic p-2 bg-brand-grey/5 rounded-lg border border-brand-grey/10 border-dashed">No deliverables added.</div>}
                </div>
                <button
                  type="button"
                  onClick={addDeliverable}
                  className="text-xs px-3 py-1.5 rounded-lg border border-brand-grey/20 text-brand-grey hover:bg-brand-grey/5 hover:text-brand-black dark:hover:text-brand-white transition-colors flex items-center gap-1 font-bold"
                >
                  <Icon icon="mdi:plus" className="w-3 h-3" /> Add Deliverable
                </button>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-brand-grey/10">
                <button onClick={() => setActive(null)} className="soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20">
                  Cancel
                </button>
                <button onClick={onSubmit} className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center gap-2">
                  <Icon icon="mdi:check" className="w-4 h-4" />
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffWorkboard;
