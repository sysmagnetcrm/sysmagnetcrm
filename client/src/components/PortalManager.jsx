import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { portalAPI, presenceAPI, notificationsAPI, usersAPI } from '../utils/supabaseServices';

const PortalManager = () => {
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [popupCfg, setPopupCfg] = useState({ enabled: false, title: '', content: '', interval_minutes: 60 });
  const [online, setOnline] = useState([]);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', user_id: '' });
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Create/update form state
  const [draft, setDraft] = useState({ id: null, title: '', message: '', status: 'ongoing', audience: 'all', client_id: '' });
  const editing = useMemo(() => draft && draft.id != null, [draft]);

  // Derived: only client users, filtered by search (must be top-level, not inside useEffect)
  const clientUsers = useMemo(() => {
    const q = (userSearch || '').toLowerCase();
    const list = (users || []).filter(u => String(u.role || '').toLowerCase() === 'client');
    if (!q) return list;
    const match = (s) => (s || '').toLowerCase().includes(q);
    return list.filter(u => match(u.name) || match(u.email));
  }, [users, userSearch]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [u, p, o, us] = await Promise.allSettled([
          portalAPI.listUpdates(),
          portalAPI.getPopupConfig(),
          presenceAPI.online(),
          usersAPI.getAll()
        ]);
        if (u.status === 'fulfilled') setUpdates(u.value.data || []);
        if (p.status === 'fulfilled') setPopupCfg({ ...(p.value.data || {}), interval_minutes: Number(p.value.data?.interval_minutes || 60) });
        if (o.status === 'fulfilled') setOnline(o.value.data || []);
        if (us.status === 'fulfilled') setUsers(us.value.data || []);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
    const t = setInterval(async () => {
      try {
        const r = await presenceAPI.online();
        setOnline(r.data || []);
      } catch {}
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const resetDraft = () => setDraft({ id: null, title: '', message: '', status: 'ongoing', audience: 'all', client_id: '' });

  const onSaveUpdate = async (e) => {
    e?.preventDefault?.();
    const payload = { title: draft.title, message: draft.message, status: draft.status, audience: draft.audience, client_id: draft.client_id || null };
    if (!payload.title?.trim()) return alert('Title is required');
    try {
      if (editing) {
        const res = await portalAPI.updateUpdate(draft.id, payload);
        const updated = res.data;
        setUpdates(prev => prev.map(u => String(u.id) === String(updated.id) ? updated : u));
      } else {
        const res = await portalAPI.createUpdate(payload);
        setUpdates(prev => [res.data, ...prev]);
      }
      resetDraft();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save update';
      alert(msg);
    }
  };

  const onEdit = (item) => {
    setDraft({ id: item.id, title: item.title || '', message: item.message || '', status: item.status || 'ongoing', audience: item.audience || 'all', client_id: item.client_id || '' });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return;
    try {
      await portalAPI.deleteUpdate(id);
      setUpdates(prev => prev.filter(u => String(u.id) !== String(id)));
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to delete update';
      alert(msg);
    }
  };

  const onSavePopup = async (e) => {
    e?.preventDefault?.();
    try {
      const res = await portalAPI.setPopupConfig({
        enabled: !!popupCfg.enabled,
        title: popupCfg.title || '',
        content: popupCfg.content || '',
        interval_minutes: Math.max(1, Number(popupCfg.interval_minutes || 60)),
        target_user_id: popupCfg.target_user_id || null,
      });
      setPopupCfg(res.data || popupCfg);
      alert('Popup configuration saved');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save popup configuration';
      alert(msg);
    }
  };

  const refreshOnline = async () => {
    try {
      const res = await presenceAPI.online();
      setOnline(res.data || []);
    } catch (err) {
      setOnline([]);
    }
  };

  const onBroadcast = async (e) => {
    e?.preventDefault?.();
    const payload = {
      title: broadcast.title,
      message: broadcast.message,
      user_id: broadcast.user_id || undefined,
    };
    if (!payload.title?.trim() || !payload.message?.trim()) return alert('Title and message are required');
    if (!payload.user_id) return alert('Please select a user');
    try {
      const res = await notificationsAPI.broadcast(payload);
      const d = res?.data || {};
      if (d.ok || res.data) {
        alert('Notification sent');
      } else {
        alert('Failed to send notification.');
      }
      setBroadcast({ title: '', message: '', user_id: '' });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to send notification';
      alert(msg);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portal Manager</h1>
          <p className="text-brand-grey">Manage client portal dashboard, announcement popup, and online users</p>
        </div>
        <div className="text-xs text-brand-grey">{loading ? 'Loading…' : ''}</div>
      </div>

      {/* Updates Section */}
      <div className="bg-white dark:bg-brand-black rounded-[1.5rem] border border-brand-grey/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-lg flex items-center gap-2">
            <Icon icon="mdi:view-dashboard-outline" className="w-5 h-5 text-brand-orange" />
            Client Portal Updates
          </div>
          {editing && (
            <button onClick={resetDraft} className="text-xs px-3 py-1.5 rounded-lg bg-brand-grey/10 hover:bg-brand-grey/20">Cancel Edit</button>
          )}
        </div>

        <form onSubmit={onSaveUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input className="soft-input" placeholder="Title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
          <select className="soft-input" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>
            {['ongoing','completed','paused'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea className="soft-input md:col-span-2" placeholder="Message" rows={3} value={draft.message} onChange={e => setDraft({ ...draft, message: e.target.value })} />
          <div className="flex items-center gap-2">
            <label className="text-xs text-brand-grey">Audience</label>
            <select className="soft-input" value={draft.audience} onChange={e => setDraft({ ...draft, audience: e.target.value })}>
              <option value="all">All Clients</option>
              <option value="specific">Specific Client</option>
            </select>
          </div>
          {draft.audience === 'specific' && (
            <div className="grid gap-2">
              <input
                className="soft-input"
                placeholder="Search clients by name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <select className="soft-input" value={draft.client_id} onChange={e => setDraft({ ...draft, client_id: e.target.value })}>
                <option value="">Select client user…</option>
                {clientUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-orange text-black hover:bg-brand-yellow/60 font-bold shadow-lg">{editing ? 'Save Update' : 'Create Update'}</button>
          </div>
        </form>

        <div className="space-y-3">
          {updates.map(u => (
            <div key={u.id} className="p-4 rounded-xl border border-brand-grey/10 bg-brand-grey/5 flex items-start justify-between">
              <div className="pr-4">
                <div className="font-bold">{u.title}</div>
                <div className="text-sm text-brand-grey whitespace-pre-wrap">{u.message}</div>
                <div className="mt-2 text-[11px] text-brand-grey">Status: {u.status || 'ongoing'} • Updated {u.updated_at ? new Date(u.updated_at).toLocaleString() : 'n/a'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(u)} className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-brand-black border border-brand-grey/10 hover:bg-brand-grey/10">Edit</button>
                <button onClick={() => onDelete(u.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
          {updates.length === 0 && (
            <div className="text-sm text-brand-grey">No updates yet.</div>
          )}
        </div>
      </div>

      {/* Broadcast Notifications */}
      <div className="bg-white dark:bg-brand-black rounded-[1.5rem] border border-brand-grey/10 p-6">
        <div className="font-bold text-lg flex items-center gap-2 mb-4">
          <Icon icon="mdi:bullhorn-outline" className="w-5 h-5 text-red-600" />
          Broadcast Notification
        </div>
        <form onSubmit={onBroadcast} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="soft-input md:col-span-2" placeholder="Title" value={broadcast.title} onChange={e => setBroadcast({ ...broadcast, title: e.target.value })} />
          <textarea className="soft-input md:col-span-2" rows={3} placeholder="Message" value={broadcast.message} onChange={e => setBroadcast({ ...broadcast, message: e.target.value })} />
          <div className="md:col-span-2 grid gap-2">
            <input
              className="soft-input"
              placeholder="Search clients by name or email…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            <select className="soft-input" value={broadcast.user_id} onChange={e => setBroadcast({ ...broadcast, user_id: e.target.value })}>
              <option value="">Specific user (required)…</option>
              {clientUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-orange text-black hover:bg-brand-yellow/60 font-bold shadow-lg">Send</button>
          </div>
        </form>
      </div>

      {/* Popup Section */}
      <div className="bg-white dark:bg-brand-black rounded-[1.5rem] border border-brand-grey/10 p-6">
        <div className="font-bold text-lg flex items-center gap-2 mb-4">
          <Icon icon="mdi:popup" className="w-5 h-5 text-purple-500" />
          Announcement Popup
        </div>
        <form onSubmit={onSavePopup} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!popupCfg.enabled} onChange={e => setPopupCfg({ ...popupCfg, enabled: e.target.checked })} /> Enable</label>
          <input className="soft-input" placeholder="Interval (minutes)" value={popupCfg.interval_minutes} onChange={e => setPopupCfg({ ...popupCfg, interval_minutes: e.target.value })} />
          <input className="soft-input md:col-span-2" placeholder="Title" value={popupCfg.title} onChange={e => setPopupCfg({ ...popupCfg, title: e.target.value })} />
          <textarea className="soft-input md:col-span-2" rows={4} placeholder="Content" value={popupCfg.content} onChange={e => setPopupCfg({ ...popupCfg, content: e.target.value })} />
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-brand-grey ml-1">Target specific user (optional)</label>
            <div className="grid gap-2">
              <input
                className="soft-input"
                placeholder="Search clients by name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <select className="soft-input" value={popupCfg.target_user_id || ''} onChange={e => setPopupCfg({ ...popupCfg, target_user_id: e.target.value })}>
                <option value="">Everyone</option>
                {clientUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-orange text-black hover:bg-brand-yellow/60 font-bold shadow-lg">Save Popup</button>
          </div>
        </form>
      </div>

      {/* Online Users */}
      <div className="bg-white dark:bg-brand-black rounded-[1.5rem] border border-brand-grey/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-lg flex items-center gap-2">
            <Icon icon="mdi:account-group-outline" className="w-5 h-5 text-green-600" />
            Online Users
          </div>
          <button onClick={refreshOnline} className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-brand-black border border-brand-grey/10 hover:bg-brand-grey/10">Refresh</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {online.map(u => (
            <div key={u.id} className="p-3 rounded-xl border border-brand-grey/10 bg-brand-grey/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm">{u.name || u.id}</div>
                  <div className="text-[11px] text-brand-grey">{u.role || 'user'} • {new Date(u.last_seen).toLocaleTimeString()}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded">Online</span>
            </div>
          ))}
          {online.length === 0 && (
            <div className="text-sm text-brand-grey">No users online.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalManager;
