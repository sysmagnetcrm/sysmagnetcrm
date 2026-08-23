import React, { useEffect, useMemo, useState } from 'react';
import { useClientTasks } from '../hooks/useClientTasks';
import { usersAPI } from '../utils/supabaseServices';
import { Icon } from '@iconify/react';

const staffRoles = ['developer', 'digital_marketer', 'hr', 'sales', 'finance', 'support'];

const AdminClientTasks = ({ users: usersProp = [] }) => {
  const { tasks, assign, approve, requestChanges, timeline, refetch, setFilters } = useClientTasks('admin');
  const [users, setUsers] = useState(usersProp);
  const [method, setMethod] = useState('manual'); // manual|round-robin|capacity
  const [role, setRole] = useState('developer');
  const [assignee, setAssignee] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (!usersProp?.length) {
      usersAPI.getAll().then(r => setUsers(r.data || [])).catch(() => setUsers([]));
    }
  }, [usersProp]);

  const staffUsers = useMemo(() => (users || []).filter(u => staffRoles.some(sr => (u.roles_json || '').toLowerCase().includes(sr) || (u.role || '').toLowerCase().includes(sr))), [users]);
  const nonClientUsers = useMemo(() => (users || []).filter(u => (u.role || '').toLowerCase() !== 'client'), [users]);
  const manualAssignees = useMemo(() => staffUsers.length ? staffUsers : nonClientUsers, [staffUsers, nonClientUsers]);

  const onAssign = async (taskId) => {
    const payload = method === 'manual' ? { method, assignee_id: assignee ? Number(assignee) : null, role } : { method, role };
    if (method === 'manual' && !payload.assignee_id) return alert('Select an assignee');
    const res = await assign(taskId, payload);
    if (res.success) {
      alert('Assigned');
      refetch();
    } else {
      alert(res.error || 'Failed to assign');
    }
  };

  const openTimeline = async (t) => {
    const res = await timeline(t.id);
    if (res.success) {
      setSelectedTask(t);
      setTimelineData(res.data);
    } else {
      alert(res.error || 'Timeline error');
    }
  };

  const onApprove = async (id) => {
    const res = await approve(id);
    if (res.success) { alert('Approved'); refetch(); } else { alert(res.error || 'Approve failed'); }
  };

  const reassign = async (taskId, newAssigneeId) => {
    const idNum = Number(newAssigneeId);
    if (!Number.isFinite(idNum)) return alert('Invalid user');
    const res = await assign(taskId, { method: 'manual', assignee_id: idNum, role });
    if (res.success) { refetch(); }
    else { alert(res.error || 'Failed to reassign'); }
  };

  const onRequestChanges = async (id) => {
    const message = prompt('Enter change request message');
    if (!message) return;
    const due = prompt('Optional: new due date (YYYY-MM-DD)') || undefined;
    const res = await requestChanges(id, message, due);
    if (res.success) { alert('Changes requested'); refetch(); } else { alert(res.error || 'Failed'); }
  };

  const incoming = tasks.filter(t => t.status === 'New');
  const submissions = tasks.filter(t => t.status === 'Submitted');
  const groupedByAssignee = useMemo(() => {
    const by = new Map();
    (tasks || []).forEach(t => {
      const key = t.assigned_to || 0;
      const arr = by.get(key) || [];
      arr.push(t);
      by.set(key, arr);
    });
    return by;
  }, [tasks]);

  const applyFilters = () => {
    const payload = {};
    if (status !== 'all') payload.status = status;
    if (role) payload.role = role;
    if (q) payload.q = q;
    if (start) payload.start = start;
    if (end) payload.end = end;
    setFilters(payload);
    refetch();
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="soft-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="mdi:filter-variant" className="w-5 h-5 text-brand-orange" />
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="soft-input w-full">
              {['all', 'New', 'In Progress', 'Submitted', 'Changes Requested', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="soft-input w-full">
              {staffRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Start</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="soft-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">End</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="soft-input w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Search</label>
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey w-5 h-5" />
              <input placeholder="Title or description" value={q} onChange={e => setQ(e.target.value)} className="soft-input w-full pl-10" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={applyFilters} className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 px-6">Apply</button>
          <button onClick={() => { setStatus('all'); setRole('developer'); setStart(''); setEnd(''); setQ(''); setFilters({}); refetch(); }} className="soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 px-6">Reset</button>
        </div>
      </div>

      {/* Assignment Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-brand-black dark:text-brand-white">Assignment Queue</h3>
          <div className="flex items-center gap-3 bg-white dark:bg-brand-grey/5 p-2 rounded-xl border border-brand-grey/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-grey uppercase ml-2">Method</span>
              <select value={method} onChange={e => setMethod(e.target.value)} className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer">
                <option value="manual">Manual</option>
                <option value="round-robin">Round-robin</option>
                <option value="capacity">Capacity</option>
              </select>
            </div>
            <div className="w-px h-4 bg-brand-grey/20"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-grey uppercase">Role</span>
              <select value={role} onChange={e => setRole(e.target.value)} className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer">
                {staffRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {method === 'manual' && (
              <>
                <div className="w-px h-4 bg-brand-grey/20"></div>
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs font-bold text-brand-grey uppercase">Assignee</span>
                  <select value={assignee} onChange={e => setAssignee(e.target.value)} className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer max-w-[200px]">
                    <option value="">Select user</option>
                    {manualAssignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email} {u.role ? `— ${u.role}` : ''}</option>
                    ))}
                  </select>
                </div>
                {staffUsers.length === 0 && (
                  <div className="text-[10px] text-brand-grey ml-2">No staff-role users found. Showing all non-client users.</div>
                )}
              </>
            )}
          </div>
        </div>

        {incoming.length === 0 ? (
          <div className="soft-card p-8 text-center text-brand-grey">
            <Icon icon="mdi:inbox-outline" className="w-12 h-12 mx-auto mb-2 opacity-50" />
            No incoming tasks
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incoming.map(t => (
              <div key={t.id} className="soft-card p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => openTimeline(t)} className="font-bold text-left text-brand-black dark:text-brand-white truncate pr-2 hover:text-brand-orange">
                    {t.title}
                  </button>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${t.priority === 'High' ? 'bg-red-100 text-red-700' :
                    t.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{t.priority}</span>
                </div>
                <div className="text-sm text-brand-grey line-clamp-2 mb-3">{t.description}</div>
                <div className="text-xs text-brand-grey mb-4 flex items-center gap-1">
                  <Icon icon="mdi:account-group-outline" className="w-4 h-4" />
                  Roles: {(JSON.parse(t.required_roles || '[]')).join(', ') || '—'}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onAssign(t.id)} className="flex-1 soft-button bg-blue-600 text-white hover:bg-blue-700 py-2 text-xs">Assign</button>
                  <button onClick={() => openTimeline(t)} className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 py-2 text-xs">View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Board */}
      <div>
        <h3 className="text-xl font-bold text-brand-black dark:text-brand-white mb-4">Team Board</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from(groupedByAssignee.entries()).map(([uid, items]) => {
            const u = (users || []).find(x => x.id === uid);
            const name = uid ? (u?.name || `User #${uid}`) : 'Unassigned';
            return (
              <div key={uid} className="soft-card p-4">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-brand-grey/10">
                  <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-brand-black dark:text-brand-white text-sm">{name}</div>
                    <div className="text-xs text-brand-grey">{items.length} task(s)</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['New', 'In Progress', 'Submitted', 'Changes Requested', 'Closed'].map(s => (
                    <div key={s} className="text-xs bg-brand-grey/5 rounded-lg px-2 py-1.5 flex items-center justify-between">
                      <span className="text-brand-grey truncate mr-1">{s}</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{items.filter(t => t.status === s).length}</span>
                    </div>
                  ))}
                </div>
                {/* Reassign tasks inline */}
                <div className="space-y-2 mt-3">
                  {items.slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <button onClick={() => openTimeline(t)} className="text-sm font-medium text-brand-black dark:text-brand-white truncate flex-1 text-left hover:text-brand-orange" title={t.title}>{t.title}</button>
                      <select
                        value={''}
                        onChange={(e) => { const v = e.target.value; e.target.value=''; if (v) reassign(t.id, v); }}
                        className="text-xs bg-transparent border border-brand-grey/20 rounded-lg px-2 py-1"
                        title="Reassign"
                      >
                        <option value="">Reassign…</option>
                        {manualAssignees.map(a => (
                          <option key={a.id} value={a.id}>{a.name || a.email}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {items.length > 6 && (
                    <div className="text-[10px] text-brand-grey">+{items.length - 6} more…</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approvals */}
      <div>
        <h3 className="text-xl font-bold text-brand-black dark:text-brand-white mb-4">Approvals</h3>
        {submissions.length === 0 ? (
          <div className="soft-card p-8 text-center text-brand-grey">
            <Icon icon="mdi:check-all" className="w-12 h-12 mx-auto mb-2 opacity-50" />
            No submissions awaiting review
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map(t => (
              <div key={t.id} className="soft-card p-5 border-l-4 border-l-brand-orange">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-brand-black dark:text-brand-white truncate pr-2">{t.title}</div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold uppercase tracking-wide">{t.status}</span>
                </div>
                <div className="text-sm text-brand-grey line-clamp-2 mb-4">{t.description}</div>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(t.id)} className="flex-1 soft-button bg-green-600 text-white hover:bg-green-700 py-2 text-xs">Approve</button>
                  <button onClick={() => onRequestChanges(t.id)} className="flex-1 soft-button bg-amber-600 text-white hover:bg-amber-700 py-2 text-xs">Request Changes</button>
                  <button onClick={() => openTimeline(t)} className="soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 py-2 px-3 text-xs">
                    <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Modal/Panel */}
      {selectedTask && timelineData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="soft-card w-full max-w-lg p-6 bg-white dark:bg-brand-black max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-bold text-lg text-brand-black dark:text-brand-white truncate pr-4">Timeline — {selectedTask.title}</h3>
              <button onClick={() => { setSelectedTask(null); setTimelineData(null); }} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey">
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
            {/* Task details header */}
            <div className="mb-4 p-3 rounded-xl bg-brand-grey/5 text-sm">
              {selectedTask.description && (
                <div className="mb-2 text-brand-black dark:text-brand-white">{selectedTask.description}</div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-brand-grey">
                <div className="flex items-center gap-1"><Icon icon="mdi:flag-outline" className="w-4 h-4" /> Priority: <span className="font-bold text-brand-black dark:text-brand-white ml-1">{selectedTask.priority || '—'}</span></div>
                <div className="flex items-center gap-1"><Icon icon="mdi:calendar" className="w-4 h-4" /> Due: <span className="font-bold text-brand-black dark:text-brand-white ml-1">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleString() : '—'}</span></div>
                <div className="flex items-center gap-1 col-span-2"><Icon icon="mdi:account-group-outline" className="w-4 h-4" /> Roles: <span className="font-bold text-brand-black dark:text-brand-white ml-1">{(() => { try { return (JSON.parse(selectedTask.required_roles || '[]') || []).join(', ') } catch { return '—' }})()}</span></div>
              </div>
              {(timelineData.attachments || []).length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-bold text-brand-grey uppercase mb-1">Attachments</div>
                  <ul className="space-y-1">
                    {(timelineData.attachments || []).map(f => (
                      <li key={f.id} className="text-xs flex items-center gap-2">
                        <Icon icon="mdi:paperclip" className="w-3.5 h-3.5 text-brand-grey" />
                        {f.storage_path ? (
                          <a href={f.storage_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{f.filename || f.storage_path}</a>
                        ) : (
                          <span className="text-brand-black dark:text-brand-white">{f.filename || 'file'}</span>
                        )}
                        <span className="text-[10px] text-brand-grey">v{f.version}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {(timelineData.logs || []).map((l, i) => (
                <div key={l.id} className="relative pl-6 pb-4 border-l border-brand-grey/20 last:border-0 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-brand-orange"></div>
                  <div className="text-xs text-brand-grey mb-1 flex items-center gap-2">
                    <span className="font-bold uppercase">{l.actor_role}</span>
                    <span>•</span>
                    <span>{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-brand-black dark:text-brand-white bg-brand-grey/5 p-3 rounded-xl">
                    {l.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClientTasks;
