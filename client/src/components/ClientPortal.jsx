import React, { useMemo, useState, useEffect } from 'react';
import { useClientTasks } from '../hooks/useClientTasks';
import { Icon } from '@iconify/react';
import { portalAPI, clientTasksAPI } from '../utils/supabaseServices';
import { useAuth } from '../context/AuthContext';

const ClientPortal = () => {
  const [tab, setTab] = useState('dashboard'); // dashboard | create | my_tasks | timeline | files
  const [selectedTask, setSelectedTask] = useState(null);
  const { tasks, create, timeline, loading, refetch } = useClientTasks('client');
  const { user } = useAuth?.() || { user: null };
  const [confirmDelete, setConfirmDelete] = useState({ open: false, task: null, loading: false });

  // Dashboard updates
  const [updates, setUpdates] = useState([]);
  const [loadingDash, setLoadingDash] = useState(false);

  // Announcement popup
  const [showPopup, setShowPopup] = useState(false);
  const [popup, setPopup] = useState({ title: '', content: '' });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingDash(true);
        const res = await portalAPI.clientDashboard();
        if (mounted) {
          const payload = res?.data;
          const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          setUpdates(arr);
        }
      } catch {
        if (mounted) setUpdates([]);
      } finally {
        if (mounted) setLoadingDash(false);
      }
    };
    if (tab === 'dashboard') load();
    return () => { mounted = false; };
  }, [tab]);

  // Poll announcement popup periodically
  useEffect(() => {
    let timer;
    const check = async () => {
      try {
        const res = await portalAPI.clientAnnouncement();
        if (res.data?.show) {
          setPopup({ title: res.data.title || 'Announcement', content: res.data.content || '' });
          setShowPopup(true);
        }
      } catch { }
    };
    check();
    timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, []);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    attachments: [],
  });

  const suggestionChips = ['Poster', 'Ads', 'Post', 'Lead'];
  const onClickSuggestion = (text) => {
    setForm((f) => ({ ...f, title: f.title ? `${f.title} ${text}` : text }));
  };

  const onAddAttachment = () => {
    const filename = prompt('Enter filename (metadata only)');
    if (!filename) return;
    setForm((f) => ({ ...f, attachments: [...f.attachments, { filename }] }));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('Title is required');
    const { title, description, priority, due_date, attachments } = form;
    const payload = { title, description, priority, due_date, attachments };
    const res = await create(payload);
    if (res.success) {
      alert('Task created');
      setForm({ title: '', description: '', priority: 'Medium', due_date: '', attachments: [] });
      setTab('my_tasks');
      refetch();
    } else {
      alert(res.error || 'Failed to create task');
    }
  };

  const [timelineData, setTimelineData] = useState(null);
  const openTimeline = async (task) => {
    const res = await timeline(task.id);
    if (res.success) {
      setSelectedTask(task);
      setTimelineData(res.data);
      setTab('timeline');
    } else {
      alert(res.error || 'Failed to load timeline');
    }
  };

  const exportTimeline = () => {
    if (!timelineData) return;
    const json = JSON.stringify({ task: selectedTask, ...timelineData }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-${selectedTask?.id || 'unknown'}-timeline.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDeleteConfirm = (e, t) => {
    e.stopPropagation();
    if (!t || !t.id) return;
    setConfirmDelete({ open: true, task: t, loading: false });
  };

  const confirmDeleteTask = async () => {
    const t = confirmDelete.task;
    if (!t?.id) return setConfirmDelete({ open: false, task: null, loading: false });
    try {
      setConfirmDelete(s => ({ ...s, loading: true }));
      await clientTasksAPI.delete(t.id);
      if (selectedTask?.id === t.id) { setSelectedTask(null); setTimelineData(null); setTab('my_tasks'); }
      setConfirmDelete({ open: false, task: null, loading: false });
      refetch();
    } catch (err) {
      setConfirmDelete({ open: false, task: null, loading: false });
      alert(err?.response?.data?.error || 'Failed to delete task');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard-outline' },
    { id: 'create', label: 'Create Task', icon: 'mdi:plus-circle-outline' },
    { id: 'my_tasks', label: 'My Tasks', icon: 'mdi:clipboard-list-outline' },
    { id: 'timeline', label: 'Timeline', icon: 'mdi:timeline-clock-outline', disabled: !selectedTask },
    { id: 'files', label: 'Files', icon: 'mdi:file-document-multiple-outline', disabled: !selectedTask },
  ];

  return (
    <div className="space-y-6 bg-gradient-to-br from-[#EAC23F]/10 via-white to-brand-grey/5 p-6 rounded-3xl min-h-[80vh]">
      <div className="flex flex-wrap gap-3 border-b border-brand-grey/10 pb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            disabled={t.disabled}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 transition-all font-bold text-sm ${tab === t.id
              ? 'bg-brand-orange text-black shadow-lg shadow-brand-orange/20 scale-105'
              : t.disabled
                ? 'bg-brand-grey/5 text-brand-grey/40 cursor-not-allowed'
                : 'bg-white dark:bg-brand-grey/5 text-brand-grey hover:bg-brand-yellow/10 hover:text-brand-black dark:hover:text-brand-white'
              }`}
            onClick={() => setTab(t.id)}
          >
            <Icon icon={t.icon} className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Updates */}
          <div className="lg:col-span-2 soft-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="font-bold text-xl flex items-center gap-2 text-brand-black dark:text-brand-white">
                <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                  <Icon icon="mdi:bullhorn-outline" className="w-5 h-5" />
                </div>
                Service Updates
              </div>
              <div className="text-xs font-bold px-2 py-1 rounded-lg bg-brand-grey/10 text-brand-grey">
                {loadingDash ? 'Loading...' : `${updates.length} New`}
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              {(Array.isArray(updates) ? updates : []).map(u => (
                <div key={u.id} className="p-4 rounded-2xl border border-brand-grey/10 bg-white dark:bg-brand-grey/5 hover:border-brand-orange/30 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-brand-black dark:text-brand-white">{u.title}</div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${(u.status || 'ongoing') === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      (u.status || 'ongoing') === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {u.status || 'ongoing'}
                    </span>
                  </div>
                  <div className="text-sm text-brand-grey leading-relaxed">{u.message}</div>
                  <div className="flex items-center gap-1 text-[11px] text-brand-grey mt-3 font-medium">
                    <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                    Updated {u.updated_at ? new Date(u.updated_at).toLocaleString() : 'recently'}
                  </div>
                </div>
              ))}
              {!loadingDash && updates.length === 0 && (
                <div className="text-center py-10 text-brand-grey bg-brand-grey/5 rounded-2xl border border-dashed border-brand-grey/20">
                  <Icon icon="mdi:check-circle-outline" className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>All caught up! No new updates.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="soft-card p-6 h-fit">
            <div className="font-bold text-xl mb-6 flex items-center gap-2 text-brand-black dark:text-brand-white">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                <Icon icon="mdi:lightning-bolt-outline" className="w-5 h-5" />
              </div>
              Quick Actions
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setTab('create')}
                className="w-full p-4 rounded-2xl border border-brand-grey/10 hover:border-brand-orange/50 hover:bg-brand-orange/5 text-left transition-all group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform">
                  <Icon icon="mdi:plus" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-brand-black dark:text-brand-white group-hover:text-brand-orange transition-colors">Create Task</div>
                  <div className="text-xs text-brand-grey mt-0.5">Request new work</div>
                </div>
                <Icon icon="mdi:chevron-right" className="w-5 h-5 text-brand-grey ml-auto group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setTab('my_tasks')}
                className="w-full p-4 rounded-2xl border border-brand-grey/10 hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition-all group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Icon icon="mdi:format-list-checks" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-brand-black dark:text-brand-white group-hover:text-blue-600 transition-colors">My Tasks</div>
                  <div className="text-xs text-brand-grey mt-0.5">Check status & progress</div>
                </div>
                <Icon icon="mdi:chevron-right" className="w-5 h-5 text-brand-grey ml-auto group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-brand-black border border-brand-grey/10 shadow-2xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-brand-grey/10">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
                <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
              </div>
              <div className="font-bold text-base text-brand-black dark:text-brand-white">Delete Task</div>
            </div>
            <div className="p-5 text-sm text-brand-grey">
              Are you sure you want to delete this task?
              <div className="mt-1 text-[11px]">This action cannot be undone.</div>
              {confirmDelete.task && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-brand-grey/5 text-brand-black dark:text-brand-white text-sm font-medium truncate" title={confirmDelete.task.title}>
                  {confirmDelete.task.title}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-brand-grey/10 flex justify-end gap-2">
              <button
                disabled={confirmDelete.loading}
                onClick={() => setConfirmDelete({ open: false, task: null, loading: false })}
                className="px-4 py-2 rounded-xl font-bold text-brand-grey hover:bg-brand-grey/10 hover:text-brand-black dark:hover:text-brand-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                disabled={confirmDelete.loading}
                className={`px-5 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 ${confirmDelete.loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {confirmDelete.loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'create' && (
        <div className="soft-card p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-brand-orange/10 text-brand-orange">
              <Icon icon="mdi:plus-circle-outline" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white">Create New Task</h2>
              <p className="text-sm text-brand-grey">Submit a new request or task for the team</p>
            </div>
          </div>

          <form onSubmit={onCreate} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-grey mb-2 ml-1 uppercase tracking-wider">Task Title *</label>
                <input
                  className="soft-input w-full text-lg font-medium"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Update Homepage Banner"
                  autoFocus
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-brand-grey py-1">Suggestions:</span>
                  {suggestionChips.map((chip) => (
                    <button
                      type="button"
                      key={chip}
                      onClick={() => onClickSuggestion(chip)}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-brand-grey/5 text-brand-grey hover:bg-brand-orange/10 hover:text-brand-orange transition-colors border border-brand-grey/10"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-grey mb-2 ml-1 uppercase tracking-wider">Description</label>
                <textarea
                  className="soft-input w-full resize-none min-h-[120px]"
                  rows={5}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide detailed requirements, goals, and any specific instructions..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-2 ml-1 uppercase tracking-wider">Priority Level</label>
                  <div className="relative">
                    <select
                      className="soft-input w-full appearance-none"
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                    >
                      {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-2 ml-1 uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    className="soft-input w-full"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-grey mb-2 ml-1 uppercase tracking-wider">Attachments</label>
                <div className="border-2 border-dashed border-brand-grey/20 rounded-2xl p-6 text-center hover:border-brand-orange/30 transition-colors bg-brand-grey/5">
                  <div className="space-y-3 mb-4">
                    {form.attachments.map((a, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 text-sm text-brand-black dark:text-brand-white bg-white dark:bg-brand-black p-3 rounded-xl shadow-sm border border-brand-grey/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-brand-grey/10 text-brand-grey">
                            <Icon icon="mdi:file-document-outline" className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{a.filename}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }))}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onAddAttachment}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/10 border border-brand-grey/20 text-brand-black dark:text-brand-white font-bold hover:bg-brand-grey/5 transition-colors shadow-sm"
                  >
                    <Icon icon="mdi:paperclip" className="w-4 h-4" />
                    Add Attachment Metadata
                  </button>
                  <p className="text-xs text-brand-grey mt-2">Click to add file details (Simulated Upload)</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-grey/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTab('dashboard')}
                className="px-6 py-3 rounded-xl font-bold text-brand-grey hover:bg-brand-grey/10 hover:text-brand-black dark:hover:text-brand-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl font-bold bg-brand-orange text-black hover:bg-brand-yellow/60 shadow-lg shadow-brand-orange/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Icon icon="mdi:check" className="w-5 h-5" />
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'my_tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">My Tasks</h2>
            <div className="text-sm font-bold text-brand-grey bg-brand-grey/10 px-3 py-1 rounded-full">
              {loading ? 'Loading...' : `${tasks.length} Active`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {tasks.map(t => (
              <div
                key={t.id}
                className="soft-card p-5 hover:shadow-xl hover:border-brand-orange/30 transition-all group cursor-pointer relative overflow-hidden"
                onClick={() => openTimeline(t)}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-orange/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>

                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="font-bold text-lg text-brand-black dark:text-brand-white truncate pr-2 flex-1">{t.title}</div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm ${t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-brand-grey/10 text-brand-grey'
                    }`}>
                    {t.status}
                  </span>
                  {user?.id && t.created_by === user.id && (
                    <button
                      onClick={(e) => openDeleteConfirm(e, t)}
                      className="ml-2 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete task"
                    >
                      <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-sm text-brand-grey line-clamp-2 mb-5 h-10 relative z-10 leading-relaxed">
                  {t.description || 'No description provided.'}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-brand-grey/10 relative z-10">
                  <div className="flex items-center gap-2 text-xs font-medium text-brand-grey">
                    <Icon icon="mdi:calendar-clock" className="w-4 h-4 text-brand-orange" />
                    {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date'}
                  </div>
                  <button className="text-xs font-bold text-brand-black dark:text-brand-white group-hover:text-brand-orange transition-colors flex items-center gap-1 bg-brand-grey/5 px-2 py-1 rounded-lg group-hover:bg-brand-orange/10">
                    View Details <Icon icon="mdi:arrow-right" className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {!loading && tasks.length === 0 && (
              <div className="col-span-full text-center py-20 bg-brand-grey/5 rounded-3xl border border-dashed border-brand-grey/20">
                <div className="w-16 h-16 mx-auto bg-brand-grey/10 rounded-full flex items-center justify-center text-brand-grey mb-4">
                  <Icon icon="mdi:clipboard-text-outline" className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">No tasks found</h3>
                <p className="text-brand-grey mt-1">You haven't created any tasks yet.</p>
                <button onClick={() => setTab('create')} className="mt-4 text-brand-orange font-bold hover:underline">
                  Create your first task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="soft-card p-8">
          {!timelineData ? (
            <div className="text-center py-20 text-brand-grey bg-brand-grey/5 rounded-3xl border border-dashed border-brand-grey/20">
              <Icon icon="mdi:timeline-clock-outline" className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a task to view its timeline.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-brand-grey/10 pb-6">
                <div>
                  <div className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-1">Project Timeline</div>
                  <div className="text-2xl font-bold text-brand-black dark:text-brand-white">{selectedTask?.title}</div>
                </div>
                <button
                  onClick={exportTimeline}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/10 border border-brand-grey/20 text-brand-black dark:text-brand-white hover:bg-brand-grey/5 hover:border-brand-orange/30 transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
                >
                  <Icon icon="mdi:download" className="w-4 h-4" /> Export History
                </button>
              </div>

              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {(timelineData.logs || []).map((l, idx) => (
                  <div key={l.id} className="relative pl-8 pb-2 border-l-2 border-brand-grey/10 last:border-0 group">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-[#121212] transition-colors ${idx === 0 ? 'bg-brand-orange scale-110 shadow-lg shadow-brand-orange/20' : 'bg-brand-grey/30 group-hover:bg-brand-orange/70'}`}></div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-brand-black dark:text-brand-white bg-brand-grey/10 px-2 py-1 rounded-lg capitalize">
                        {l.actor_role}
                      </span>
                      <span className="text-[10px] font-medium text-brand-grey flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                        {new Date(l.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-sm text-brand-black dark:text-brand-white bg-white dark:bg-brand-grey/5 p-4 rounded-2xl rounded-tl-none border border-brand-grey/10 shadow-sm group-hover:shadow-md transition-all group-hover:border-brand-orange/20">
                      {l.message}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-brand-grey/10">
                <div className="font-bold text-brand-black dark:text-brand-white mb-4 text-sm flex items-center gap-2 uppercase tracking-wider">
                  <Icon icon="mdi:paperclip" className="w-4 h-4 text-brand-orange" />
                  Task Attachments
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(timelineData.attachments || []).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-brand-grey/10 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all cursor-pointer group bg-white dark:bg-brand-grey/5">
                      <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xs group-hover:scale-110 transition-transform">
                        v{a.version}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-brand-black dark:text-brand-white truncate">{a.filename}</div>
                        <div className="text-[10px] text-brand-grey">Click to download</div>
                      </div>
                      <Icon icon="mdi:download" className="w-4 h-4 text-brand-grey ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  {(timelineData.attachments || []).length === 0 && (
                    <div className="col-span-full text-sm text-brand-grey italic py-4 text-center bg-brand-grey/5 rounded-xl border border-dashed border-brand-grey/20">
                      No attachments found for this task.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'files' && (
        <div className="soft-card p-8">
          {!timelineData ? (
            <div className="text-center py-20 text-brand-grey bg-brand-grey/5 rounded-3xl border border-dashed border-brand-grey/20">
              <Icon icon="mdi:folder-open-outline" className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Open a task timeline to view its files.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-1">Project Files</div>
                  <div className="text-xl font-bold text-brand-black dark:text-brand-white flex items-center gap-2">
                    <Icon icon="mdi:folder-outline" className="w-5 h-5 text-brand-grey" />
                    {selectedTask?.title}
                  </div>
                </div>
                <button onClick={exportTimeline} className="px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/10 border border-brand-grey/20 text-brand-black dark:text-brand-white hover:bg-brand-grey/5 hover:border-brand-orange/30 transition-all shadow-sm flex items-center gap-2 font-bold text-sm">
                  <Icon icon="mdi:download" className="w-4 h-4" /> Export All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(timelineData.attachments || []).length === 0 && (
                  <div className="col-span-full text-center py-16 text-brand-grey italic bg-brand-grey/5 rounded-2xl border border-dashed border-brand-grey/20">
                    <Icon icon="mdi:file-hidden" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No files have been uploaded for this task yet.
                  </div>
                )}
                {(timelineData.attachments || []).map(a => (
                  <div key={a.id} className="p-5 rounded-2xl border border-brand-grey/10 hover:shadow-lg hover:border-brand-orange/30 transition-all bg-white dark:bg-brand-grey/5 group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-orange/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Icon icon="mdi:file-document-outline" className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold bg-brand-grey/10 text-brand-grey px-2 py-1 rounded-full">v{a.version}</span>
                    </div>

                    <div className="relative z-10">
                      <div className="font-bold text-sm text-brand-black dark:text-brand-white truncate mb-1" title={a.filename}>{a.filename}</div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-brand-grey">{new Date().toLocaleDateString()}</div>
                        <Icon icon="mdi:download" className="w-4 h-4 text-brand-grey hover:text-brand-orange transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Announcement Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-brand-black border border-brand-grey/10 shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-brand-grey/10 bg-brand-orange/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-orange text-black shadow-lg shadow-brand-orange/20">
                  <Icon icon="mdi:bell-ring-outline" className="w-6 h-6" />
                </div>
                <div className="font-bold text-xl text-brand-black dark:text-brand-white">{popup.title}</div>
              </div>
              <button onClick={() => setShowPopup(false)} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey transition-colors">
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="text-base text-brand-grey leading-relaxed whitespace-pre-wrap">
                {popup.content}
              </div>
            </div>
            <div className="p-6 border-t border-brand-grey/10 bg-brand-grey/5 flex justify-end">
              <button
                onClick={() => setShowPopup(false)}
                className="px-8 py-3 rounded-xl bg-brand-black dark:bg-brand-white text-white dark:text-brand-black hover:bg-brand-orange hover:text-black font-bold transition-all shadow-lg active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
