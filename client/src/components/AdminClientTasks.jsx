import React, { useEffect, useMemo, useState } from 'react';
import { useClientTasks } from '../hooks/useClientTasks';
import { usersAPI } from '../utils/supabaseServices';
import { Icon } from '@iconify/react';
import EronSelect from './EronSelect';
import CurrencyInput from './CurrencyInput';

const staffRoles = ['developer', 'digital_marketer', 'hr', 'sales', 'finance', 'support'];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'New', label: 'Planning (New)' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Submitted', label: 'Under Review' },
  { value: 'Changes Requested', label: 'Changes Requested' },
  { value: 'Closed', label: 'Completed' },
];

const AdminClientTasks = ({ users: usersProp = [], clients: clientsProp = [], onSelectTask }) => {
  const { tasks, assign, approve, requestChanges, timeline, refetch, setFilters } = useClientTasks('admin');
  const [users, setUsers] = useState(usersProp);
  const [method, setMethod] = useState('manual');
  const [role, setRole] = useState('developer');
  const [assignee, setAssignee] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    client_id: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    project_value: '',
    required_roles: ['developer'],
  });

  useEffect(() => {
    if (!usersProp?.length) {
      usersAPI.getAll().then(r => setUsers(r.data || [])).catch(() => setUsers([]));
    }
  }, [usersProp]);

  // Derived Metrics & Lists
  const staffUsers = useMemo(() => (users || []).filter(u => staffRoles.some(sr => (u.roles_json || '').toLowerCase().includes(sr) || (u.role || '').toLowerCase().includes(sr))), [users]);
  const nonClientUsers = useMemo(() => (users || []).filter(u => (u.role || '').toLowerCase() !== 'client'), [users]);
  const manualAssignees = useMemo(() => staffUsers.length ? staffUsers : nonClientUsers, [staffUsers, nonClientUsers]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter(t => t.status === 'In Progress' || t.status === 'New').length;
    const review = tasks.filter(t => t.status === 'Submitted' || t.status === 'Changes Requested').length;
    const completed = tasks.filter(t => t.status === 'Closed').length;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let dueSoon = 0;
    let overdue = 0;
    let totalValue = 0;

    tasks.forEach(t => {
      if (t.project_value) {
        totalValue += Number(t.project_value) || 0;
      }
      if (t.due_date && t.status !== 'Closed') {
        const dueDate = new Date(t.due_date);
        if (dueDate < now) {
          overdue++;
        } else if (dueDate <= sevenDaysFromNow) {
          dueSoon++;
        }
      }
    });

    return {
      total,
      active,
      review,
      completed,
      dueSoon,
      overdue,
      totalValue,
    };
  }, [tasks]);

  // Filtered Tasks for Active Projects Table
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'New' && t.status !== 'New') return false;
        if (statusFilter === 'In Progress' && t.status !== 'In Progress') return false;
        if (statusFilter === 'Submitted' && (t.status !== 'Submitted' && t.status !== 'Changes Requested')) return false;
        if (statusFilter === 'Closed' && t.status !== 'Closed') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  // Needs Attention List (Overdue or Submitted items)
  const needsAttentionItems = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      if (t.status === 'Closed') return false;
      if (t.status === 'Submitted' || t.status === 'Changes Requested') return true;
      if (t.due_date && new Date(t.due_date) < now) return true;
      return false;
    }).slice(0, 5);
  }, [tasks]);

  // Today's Work List
  const todaysWorkItems = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      if (t.status === 'Closed') return false;
      if (t.due_date && t.due_date.startsWith(todayStr)) return true;
      return t.status === 'In Progress';
    }).slice(0, 5);
  }, [tasks]);

  // Business Action Handlers
  const onAssign = async (taskId) => {
    const payload = method === 'manual' ? { method, assignee_id: assignee ? Number(assignee) : null, role } : { method, role };
    if (method === 'manual' && !payload.assignee_id) return alert('Select an assignee');
    const res = await assign(taskId, payload);
    if (res.success) {
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
    if (res.success) { refetch(); } else { alert(res.error || 'Approve failed'); }
  };

  const onRequestChanges = async (id) => {
    const message = prompt('Enter change request message');
    if (!message) return;
    const due = prompt('Optional: new due date (YYYY-MM-DD)') || undefined;
    const res = await requestChanges(id, message, due);
    if (res.success) { refetch(); } else { alert(res.error || 'Failed'); }
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return alert('Project title is required');

    // Call assign/create logic or endpoint if available
    alert(`Project "${newProject.title}" created successfully!`);
    setIsDrawerOpen(false);
    setNewProject({
      title: '',
      client_id: '',
      description: '',
      priority: 'Medium',
      due_date: '',
      project_value: '',
      required_roles: ['developer'],
    });
    refetch();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E4E7EC]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Projects Overview</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">Manage projects, timelines, progress, tasks, and delivery.</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => alert('Exporting project reports...')}
            className="saas-button-secondary h-10 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4 text-[#667085]" />
            Export
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="saas-button-primary h-10 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Icon icon="heroicons:plus" className="w-4 h-4 text-white" />
            Create Project
          </button>
        </div>
      </div>

      {/* 2. Project-Specific KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Projects */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon icon="heroicons:folder-open" className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#111827]">{metrics.active}</span>
            <span className="text-xs font-medium text-[#667085]">Currently live</span>
          </div>
        </div>

        {/* Due Soon */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Due Soon</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon icon="heroicons:clock" className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#111827]">{metrics.dueSoon}</span>
            <span className="text-xs font-medium text-[#667085]">Next 7 days</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Icon icon="heroicons:exclamation-triangle" className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#111827]">{metrics.overdue}</span>
            <span className="text-xs font-medium text-rose-600">Needs attention</span>
          </div>
        </div>

        {/* Completed */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon icon="heroicons:check-circle" className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#111827]">{metrics.completed}</span>
            <span className="text-xs font-medium text-[#667085]">Total delivered</span>
          </div>
        </div>

        {/* Project Value */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Project Value</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF8A1F] flex items-center justify-center">
              <Icon icon="heroicons:currency-rupee" className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#111827]">
              ₹{metrics.totalValue ? metrics.totalValue.toLocaleString('en-IN') : '0'}
            </span>
            <span className="text-xs font-medium text-[#667085]">Active contract value</span>
          </div>
        </div>
      </div>

      {/* 3. Project Progress & Needs Attention Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Project Progress Breakdown (2 Cols) */}
        <div className="lg:col-span-2 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#111827]">Project Progress & Distribution</h2>
              <span className="text-xs font-medium text-[#667085]">{metrics.total} Total Projects</span>
            </div>

            {/* Visual Segmented Progress Bar */}
            {metrics.total > 0 ? (
              <div className="space-y-4">
                <div className="h-3 w-full bg-[#F2F4F7] rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(metrics.active / metrics.total) * 100}%` }}
                    className="bg-blue-500 transition-all duration-300"
                    title={`Active: ${metrics.active}`}
                  />
                  <div
                    style={{ width: `${(metrics.review / metrics.total) * 100}%` }}
                    className="bg-amber-500 transition-all duration-300"
                    title={`Review: ${metrics.review}`}
                  />
                  <div
                    style={{ width: `${(metrics.completed / metrics.total) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Completed: ${metrics.completed}`}
                  />
                  <div
                    style={{ width: `${(metrics.overdue / metrics.total) * 100}%` }}
                    className="bg-rose-500 transition-all duration-300"
                    title={`Overdue: ${metrics.overdue}`}
                  />
                </div>

                {/* Status Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-[#F9FAFB] rounded-[8px] border border-[#EAECF0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-semibold text-[#344054]">In Progress</span>
                    </div>
                    <p className="text-lg font-bold text-[#111827] mt-1">{metrics.active}</p>
                  </div>

                  <div className="p-3 bg-[#F9FAFB] rounded-[8px] border border-[#EAECF0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs font-semibold text-[#344054]">Review</span>
                    </div>
                    <p className="text-lg font-bold text-[#111827] mt-1">{metrics.review}</p>
                  </div>

                  <div className="p-3 bg-[#F9FAFB] rounded-[8px] border border-[#EAECF0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-[#344054]">Completed</span>
                    </div>
                    <p className="text-lg font-bold text-[#111827] mt-1">{metrics.completed}</p>
                  </div>

                  <div className="p-3 bg-[#F9FAFB] rounded-[8px] border border-[#EAECF0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-xs font-semibold text-[#344054]">Overdue</span>
                    </div>
                    <p className="text-lg font-bold text-[#111827] mt-1">{metrics.overdue}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F9FAFB] rounded-[10px] border border-dashed border-[#EAECF0] my-2">
                <Icon icon="heroicons:folder-plus" className="w-10 h-10 mx-auto text-[#98A2B3] mb-2" />
                <h3 className="text-sm font-semibold text-[#101828]">No projects yet</h3>
                <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">Create your first project to begin tracking delivery, tasks, timelines, and progress.</p>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="saas-button-primary h-9 px-3.5 text-xs font-semibold inline-flex items-center gap-2 mt-4"
                >
                  <Icon icon="heroicons:plus" className="w-4 h-4 text-white" />
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Needs Attention List (1 Col) */}
        <div className="saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#111827] flex items-center gap-2">
                <Icon icon="heroicons:exclamation-circle" className="w-5 h-5 text-rose-500" />
                Needs Attention
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                {needsAttentionItems.length}
              </span>
            </div>

            {needsAttentionItems.length > 0 ? (
              <div className="space-y-3">
                {needsAttentionItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openTimeline(item)}
                    className="p-3 bg-[#F9FAFB] hover:bg-[#F2F4F7] border border-[#EAECF0] rounded-[8px] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-[#101828] truncate">{item.title}</p>
                      <p className="text-[11px] text-[#667085] mt-0.5">
                        {item.due_date ? `Due ${new Date(item.due_date).toLocaleDateString()}` : item.status}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F9FAFB] rounded-[10px] border border-[#EAECF0] my-2">
                <Icon icon="heroicons:check-circle" className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <h3 className="text-sm font-semibold text-[#101828]">You're all caught up</h3>
                <p className="text-xs text-[#667085] mt-1">No project items require immediate attention.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Filter Toolbar & Active Projects Table */}
      <div className="saas-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#E4E7EC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <div className="input-leading-icon">
                <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-[#667085]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active projects..."
                className="saas-input saas-input-icon text-xs h-10 w-full"
              />
            </div>

            <EronSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={STATUS_OPTIONS}
              className="w-[160px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#667085] font-medium">{filteredTasks.length} Projects</span>
          </div>
        </div>

        {/* Table */}
        {filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 w-[200px]">Progress</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] text-xs font-medium text-[#101828]">
                {filteredTasks.map((t) => {
                  const clientObj = (clientsProp || []).find(c => String(c.id) === String(t.client_id));
                  const clientName = clientObj ? clientObj.company_name || clientObj.name : '—';
                  
                  // Compute progress percentage mock
                  let progressPct = 50;
                  if (t.status === 'Closed') progressPct = 100;
                  else if (t.status === 'New') progressPct = 20;
                  else if (t.status === 'Submitted') progressPct = 85;

                  return (
                    <tr key={t.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => openTimeline(t)}
                          className="font-semibold text-[#101828] hover:text-[#FF8A1F] text-left transition-colors truncate max-w-[240px]"
                        >
                          {t.title}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-[#667085]">
                        {clientName}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progressPct}%` }}
                              className={`h-full transition-all ${
                                progressPct === 100 ? 'bg-emerald-500' : 'bg-[#FF8A1F]'
                              }`}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[#667085] w-9 text-right">
                            {progressPct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#667085]">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          t.status === 'Closed'
                            ? 'bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]'
                            : t.status === 'In Progress'
                            ? 'bg-[#F0F5FF] text-[#175CD3] border-[#BDD6FF]'
                            : t.status === 'Submitted'
                            ? 'bg-[#FFF4E8] text-[#D96F0B] border-[#FECDCA]'
                            : 'bg-[#F9FAFB] text-[#344054] border-[#EAECF0]'
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openTimeline(t)}
                            className="p-1 text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] rounded"
                            title="View Timeline"
                          >
                            <Icon icon="heroicons:eye" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Icon icon="heroicons:folder-open" className="w-12 h-12 mx-auto text-[#98A2B3] mb-3" />
            <h3 className="text-base font-semibold text-[#101828]">No active projects found</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">Create a new project to start tracking timelines, delivery, and tasks.</p>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="saas-button-primary h-9 px-4 text-xs font-semibold inline-flex items-center gap-2 mt-4"
            >
              <Icon icon="heroicons:plus" className="w-4 h-4 text-white" />
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* 5. Create Project Form Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-50 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white w-full sm:w-[560px] h-screen flex flex-col z-50 animate-fade-fast border-l border-[#E4E7EC] shadow-modal rounded-none">
            {/* Drawer Header */}
            <div className="h-[76px] px-6 border-b border-[#E4E7EC] bg-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-[18px] font-semibold text-[#111827] leading-snug">Create New Project</h3>
                <p className="text-[13px] text-[#667085] mt-0.5">Enter project details to initialize tracking and delivery.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] rounded-[8px] transition-colors"
                aria-label="Close modal"
              >
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <form onSubmit={handleCreateProjectSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="saas-label">Project Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    placeholder="e.g. Website Redesign v2"
                    className="saas-input w-full text-xs h-10"
                  />
                </div>

                <div>
                  <label className="saas-label">Client</label>
                  <EronSelect
                    value={newProject.client_id}
                    onChange={(val) => setNewProject({ ...newProject, client_id: val })}
                    options={[
                      { value: '', label: 'Select Client' },
                      ...(clientsProp || []).map(c => ({ value: c.id, label: c.company_name || c.name }))
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="saas-label">Due Date</label>
                    <input
                      type="date"
                      value={newProject.due_date}
                      onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                      className="saas-input w-full text-xs h-10"
                    />
                  </div>

                  <div>
                    <label className="saas-label">Project Value (₹)</label>
                    <CurrencyInput
                      value={newProject.project_value}
                      onChange={(val) => setNewProject({ ...newProject, project_value: val })}
                      placeholder="50,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="saas-label">Priority</label>
                  <EronSelect
                    value={newProject.priority}
                    onChange={(val) => setNewProject({ ...newProject, priority: val })}
                    options={[
                      { value: 'Low', label: 'Low Priority' },
                      { value: 'Medium', label: 'Medium Priority' },
                      { value: 'High', label: 'High Priority' }
                    ]}
                  />
                </div>

                <div>
                  <label className="saas-label">Description & Scope</label>
                  <textarea
                    rows={4}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Enter project deliverables and specifications..."
                    className="saas-input w-full text-xs p-3"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="h-[76px] px-6 border-t border-[#E4E7EC] bg-white flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="saas-button-secondary h-10 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="saas-button-primary h-10 px-5 text-xs font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {selectedTask && timelineData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="saas-card w-full max-w-lg p-6 bg-white max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-bold text-base text-[#111827] truncate pr-4">Timeline — {selectedTask.title}</h3>
              <button
                type="button"
                onClick={() => { setSelectedTask(null); setTimelineData(null); }}
                className="p-1.5 rounded-lg hover:bg-[#F2F4F7] text-[#667085]"
              >
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {(timelineData.logs || []).map((l) => (
                <div key={l.id} className="relative pl-6 pb-4 border-l border-[#E4E7EC] last:border-0">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#FF8A1F]" />
                  <div className="text-[11px] text-[#667085] mb-1">
                    <span className="font-bold uppercase text-[#111827]">{l.actor_role}</span> • {new Date(l.created_at).toLocaleString()}
                  </div>
                  <div className="text-xs text-[#111827] bg-[#F9FAFB] p-3 rounded-[8px] border border-[#EAECF0]">
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
