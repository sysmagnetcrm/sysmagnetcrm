import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { useTasks } from '../hooks/useTasks';
import { useLeads } from '../hooks/useLeads';
import { useClients } from '../hooks/useClients';
import { paymentsAPI, activitiesAPI } from '../utils/supabaseServices';

const Dashboard = ({ onAddClient, onSelectTask, setPanel }) => {
  const { user } = useAuth();
  const role = (user?.role || 'client').toLowerCase();

  const [timeframe, setTimeframe] = useState('30d');
  const [payments, setPayments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Real Data Hooks
  const { stats, loading: statsLoading } = useDashboard(timeframe);
  const { tasks, loading: tasksLoading } = useTasks({}, true);
  const leadsEnabled = ['admin', 'sales', 'digital_marketer'].includes(role);
  const { leads, loading: leadsLoading } = useLeads({}, leadsEnabled);
  const { clients, loading: clientsLoading } = useClients({}, true);

  // Load Payments & Activities
  useEffect(() => {
    const loadExtraData = async () => {
      setLoadingData(true);
      try {
        const [payRes, actRes] = await Promise.allSettled([
          paymentsAPI.getAll(),
          activitiesAPI.getAll(),
        ]);

        if (payRes.status === 'fulfilled') {
          setPayments(payRes.value?.data || []);
        }
        if (actRes.status === 'fulfilled') {
          setActivities(actRes.value?.data || []);
        }
      } catch (err) {
        console.warn('Dashboard extra data load error:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadExtraData();
  }, []);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Team';

  // Derived Metrics
  const activeClientsCount = (clients || []).filter(c => c.status === 'Active').length;
  const activeLeadsCount = (leads || []).filter(l => !['Won', 'Lost', 'Converted'].includes(l.status)).length;
  const openTasksCount = (tasks || []).filter(t => t.status !== 'Completed' && t.status !== 'done').length;
  const totalRevenue = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Needs Attention Items
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = (tasks || []).filter(t => t.due_date && t.due_date < today && t.status !== 'Completed' && t.status !== 'done');
  const overduePayments = (payments || []).filter(p => p.payment_status === 'Pending' && p.due_date && p.due_date < today);
  const unassignedLeads = (leads || []).filter(l => !l.assigned_to && l.status === 'New');

  const needsAttentionList = [
    ...overdueTasks.map(t => ({ id: `task-${t.id}`, type: 'task', title: `Overdue Task: "${t.title}"`, subtitle: `Due ${t.due_date}`, action: () => onSelectTask && onSelectTask(t) })),
    ...overduePayments.map(p => ({ id: `pay-${p.id}`, type: 'payment', title: `Overdue Payment: Invoice #${p.invoice_no || p.id.slice(0, 6)}`, subtitle: `Amount ₹${p.amount}`, action: () => setPanel && setPanel('payments') })),
    ...unassignedLeads.map(l => ({ id: `lead-${l.id}`, type: 'lead', title: `New Unassigned Lead: "${l.name}"`, subtitle: l.company || l.email, action: () => setPanel && setPanel('leads') })),
  ];

  // Pipeline Stages Breakdown
  const pipelineStages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const pipelineStats = pipelineStages.map(stage => {
    const stageLeads = (leads || []).filter(l => (l.status || 'New').toLowerCase() === stage.toLowerCase());
    return {
      stage,
      count: stageLeads.length,
      value: stageLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0),
    };
  });

  // Chart Data Generation from Real Payments
  const chartData = React.useMemo(() => {
    if (!payments.length) return [];
    const grouped = {};
    payments.forEach(p => {
      const dateKey = p.payment_date || p.created_at?.split('T')[0] || 'Recent';
      grouped[dateKey] = (grouped[dateKey] || 0) + (Number(p.amount) || 0);
    });
    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-10)
      .map(([date, amount]) => ({ date, amount }));
  }, [payments]);

  return (
    <div className="space-y-6 py-2 font-sans">
      {/* 1. Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {getGreeting()}, {displayName} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Here's what needs your attention today.</p>
        </div>

        {/* Quick Action CTAs (Permission-gated) */}
        <div className="flex flex-wrap items-center gap-2">
          {['admin', 'sales', 'digital_marketer'].includes(role) && (
            <button onClick={() => setPanel && setPanel('leads')} className="btn-primary flex items-center gap-1.5 text-xs">
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          )}
          {['admin', 'sales'].includes(role) && (
            <button onClick={() => setPanel && setPanel('clients')} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          )}
          {['admin', 'sales', 'developer', 'hr'].includes(role) && (
            <button onClick={() => onSelectTask && onSelectTask(null)} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <Icon icon="heroicons:banknotes" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <p className="text-xs text-gray-500 mt-1">Total payments collected</p>
        </div>

        {/* Card 2: Active Clients */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Clients</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Icon icon="heroicons:building-office-2" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeClientsCount}</div>
          <p className="text-xs text-gray-500 mt-1">Active client organizations</p>
        </div>

        {/* Card 3: Active Leads */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Leads</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF8A1F] flex items-center justify-center">
              <Icon icon="heroicons:user-group" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeLeadsCount}</div>
          <p className="text-xs text-gray-500 mt-1">Qualified sales opportunities</p>
        </div>

        {/* Card 4: Open Tasks */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Open Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Icon icon="heroicons:clipboard-document-check" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{openTasksCount}</div>
          <p className="text-xs text-gray-500 mt-1">Tasks pending completion</p>
        </div>
      </div>

      {/* 3. Main Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Revenue Overview & Sales Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Overview Chart */}
          <div className="saas-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Revenue Overview</h3>
                <p className="text-xs text-gray-500">Recorded payment collection timeline</p>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                {['7d', '30d', '3m', '6m', '12m'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      timeframe === t ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-gray-200 rounded-lg">
                <Icon icon="heroicons:chart-bar" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-gray-700">Not enough data yet</h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                  Record payments to start generating real-time revenue analytics charts.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF8A1F" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#FF8A1F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Area type="monotone" dataKey="amount" stroke="#FF8A1F" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Sales Pipeline */}
          {leadsEnabled && (
            <div className="saas-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Sales Pipeline</h3>
                  <p className="text-xs text-gray-500">Distribution of leads across sales stages</p>
                </div>
                <button onClick={() => setPanel && setPanel('leads')} className="btn-ghost text-xs">
                  View Leads →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {pipelineStats.map(s => (
                  <div
                    key={s.stage}
                    onClick={() => setPanel && setPanel('leads')}
                    className="p-3 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-[10px] cursor-pointer transition-all text-center"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block truncate">{s.stage}</span>
                    <span className="text-lg font-bold text-gray-900 mt-1 block">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Work */}
          <div className="saas-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Today's Work</h3>
                <p className="text-xs text-gray-500">Active tasks requiring action</p>
              </div>
              <button onClick={() => setPanel && setPanel('tasks')} className="btn-ghost text-xs">
                View all →
              </button>
            </div>

            <div className="space-y-2">
              {(tasks || []).slice(0, 5).map(t => {
                const isOverdue = t.due_date && t.due_date < today && t.status !== 'Completed' && t.status !== 'done';
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask && onSelectTask(t)}
                    className={`p-3 rounded-[8px] border transition-all cursor-pointer flex items-center justify-between ${
                      isOverdue ? 'bg-rose-50/60 border-red-200' : 'bg-white border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {t.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Icon icon="heroicons:calendar" className="w-3.5 h-3.5" />
                          <span>{t.due_date || 'No due date'}</span>
                          {isOverdue && <span className="text-red-600 font-semibold ml-1">(Overdue)</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${
                      t.status === 'Completed' || t.status === 'done' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {t.status || 'Pending'}
                    </span>
                  </div>
                );
              })}

              {(tasks || []).length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">
                  You're all caught up. No tasks need your attention today.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Needs Attention & Recent Activity */}
        <div className="space-y-6">
          {/* Needs Attention Panel */}
          <div className="saas-card p-6 border-l-4 border-l-[#FF8A1F]">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="heroicons:exclamation-circle" className="w-5 h-5 text-[#FF8A1F]" />
              <h3 className="text-base font-semibold text-gray-900">Needs Attention</h3>
            </div>

            {needsAttentionList.length === 0 ? (
              <div className="py-6 text-center">
                <Icon icon="heroicons:check-circle" className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-800">You're all caught up</p>
                <p className="text-xs text-gray-400 mt-0.5">No items require your attention.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {needsAttentionList.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    onClick={item.action}
                    className="p-3 rounded-lg bg-orange-50/50 hover:bg-orange-50 border border-orange-200/60 cursor-pointer transition-colors"
                  >
                    <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="saas-card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {activities.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No recent activity logged.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activities.slice(0, 8).map(act => (
                  <div key={act.id} className="flex items-start gap-3 text-xs border-b border-gray-100 pb-2.5 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon icon="heroicons:clock" className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{act.action}</p>
                      <p className="text-gray-500">{act.entity_type || 'System record'}</p>
                      <span className="text-[10px] text-gray-400">{act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
