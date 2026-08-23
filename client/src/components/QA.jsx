import React, { useEffect, useMemo, useState } from 'react';
import { ticketsAPI } from '../utils/supabaseServices';
import { Icon } from '@iconify/react';
import { useFeatures } from '../hooks/useFeatures';

const StatusBadge = ({ status }) => {
  const colors = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-brand-grey/10 text-brand-grey'
  };
  const icons = {
    open: 'mdi:alert-circle-outline',
    in_progress: 'mdi:progress-clock',
    resolved: 'mdi:check-circle-outline',
    closed: 'mdi:check-all'
  };
  const text = String(status || '').replace('_', ' ');
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${colors[status] || 'bg-brand-grey/10 text-brand-grey'}`}>
      <Icon icon={icons[status] || 'mdi:circle-outline'} className="w-3.5 h-3.5" />
      {text}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    low: 'bg-brand-grey/10 text-brand-grey',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${colors[priority] || 'bg-brand-grey/10 text-brand-grey'}`}>
      {priority}
    </span>
  );
};

function QA() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const { tickets: ticketsEnabled, loading: flagsLoading } = useFeatures();

  const [newTicket, setNewTicket] = useState({ external_id: '', title: '', description: '', priority: 'medium' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      if (!ticketsEnabled) {
        setTickets([]);
        return;
      }
      const res = await ticketsAPI.getAll(filter ? { status: filter } : {});
      setTickets(res.data || []);
    } catch (e) {
      setError(e?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ticketsEnabled]);

  if (!ticketsEnabled && !flagsLoading) {
    return (
      <div className="soft-card p-6">
        <div className="flex items-center gap-2 text-brand-grey">
          <Icon icon="mdi:ticket-confirmation-outline" className="w-5 h-5" />
          <span className="text-sm font-medium">Tickets module is disabled.</span>
        </div>
      </div>
    );
  }

  const grouped = useMemo(() => {
    const groups = { open: [], in_progress: [], resolved: [], closed: [] };
    tickets.forEach(t => { (groups[t.status] || (groups[t.status] = [])).push(t); });
    return groups;
  }, [tickets]);

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      await ticketsAPI.upsert(newTicket);
      setNewTicket({ external_id: '', title: '', description: '', priority: 'medium' });
      fetchTickets();
    } catch (e2) {
      setError(e2?.message || 'Failed to create ticket');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await ticketsAPI.update(id, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (e) {
      setError(e?.message || 'Failed to update ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">QA Tickets</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/5 px-3 py-2 rounded-xl border border-brand-grey/10">
            <Icon icon="mdi:filter-variant" className="text-brand-grey w-4 h-4" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer p-0"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button
            onClick={fetchTickets}
            className="soft-button bg-brand-black text-white dark:bg-brand-white dark:text-brand-black hover:opacity-90 flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Icon icon="mdi:refresh" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="soft-card p-6">
        <h3 className="text-sm font-bold text-brand-grey uppercase tracking-wider mb-4">Create New Ticket</h3>
        <form onSubmit={createTicket} className="grid md:grid-cols-4 gap-4">
          <input
            placeholder="External ID (optional)"
            value={newTicket.external_id}
            onChange={e => setNewTicket(t => ({ ...t, external_id: e.target.value }))}
            className="soft-input"
          />
          <input
            required
            placeholder="Title"
            value={newTicket.title}
            onChange={e => setNewTicket(t => ({ ...t, title: e.target.value }))}
            className="soft-input"
          />
          <select
            value={newTicket.priority}
            onChange={e => setNewTicket(t => ({ ...t, priority: e.target.value }))}
            className="soft-input"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            type="submit"
            className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            Add / Upsert
          </button>
          <textarea
            placeholder="Description"
            value={newTicket.description}
            onChange={e => setNewTicket(t => ({ ...t, description: e.target.value }))}
            className="md:col-span-4 soft-input"
            rows={2}
          />
        </form>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['open', 'in_progress', 'resolved', 'closed'].map(col => (
          <div key={col} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="text-xs font-bold text-brand-grey uppercase tracking-wider">{col.replace('_', ' ')}</div>
              <span className="bg-brand-grey/10 text-brand-grey text-xs font-bold px-2 py-0.5 rounded-lg">
                {(grouped[col] || []).length}
              </span>
            </div>
            <div className="space-y-3 min-h-[200px] bg-brand-grey/5 rounded-xl p-2">
              {(grouped[col] || []).map(t => (
                <div key={t.id} className="soft-card p-4 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-bold text-sm text-brand-black dark:text-brand-white truncate flex-1" title={t.title}>{t.title}</div>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="text-xs text-brand-grey line-clamp-3 mb-3">{t.description}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-brand-grey/10">
                    <StatusBadge status={t.status} />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {['open', 'in_progress', 'resolved', 'closed'].filter(s => s !== t.status).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(t.id, s)}
                          className="p-1 rounded hover:bg-brand-grey/10 text-brand-grey hover:text-brand-black dark:hover:text-brand-white transition-colors"
                          title={`Move to ${s.replace('_', ' ')}`}
                        >
                          <Icon icon={
                            s === 'open' ? 'mdi:alert-circle-outline' :
                              s === 'in_progress' ? 'mdi:progress-clock' :
                                s === 'resolved' ? 'mdi:check-circle-outline' :
                                  'mdi:check-all'
                          } className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {(grouped[col] || []).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-brand-grey/30 py-8">
                  <Icon icon="mdi:clipboard-text-off-outline" className="w-8 h-8 mb-2" />
                  <span className="text-xs font-medium">No tickets</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QA;
