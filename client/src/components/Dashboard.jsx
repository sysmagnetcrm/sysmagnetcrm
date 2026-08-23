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

  // Hooks
  const { stats, loading: statsLoading } = useDashboard(timeframe);
  const { tasks, markTaskDone, loading: tasksLoading } = useTasks({}, true);
  const leadsEnabled = ['admin', 'sales', 'digital_marketer'].includes(role);
  const { leads, loading: leadsLoading } = useLeads({}, leadsEnabled);
  const { clients, loading: clientsLoading } = useClients({}, true);

  // Fetch payments and activity feed
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
        console.warn('Dashboard data load error:', err);
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

  // Format Display Name cleanly (No email address in greeting)
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Admin';
  };

  // Metrics
  const activeClientsCount = (clients || []).filter(c => c.status === 'Active').length;
  const activeLeadsCount = (leads || []).filter(l => !['Won', 'Lost', 'Converted'].includes(l.status)).length;
  const openTasksCount = (tasks || []).filter(t => t.status !== 'Completed' && t.status !== 'done').length;
  const totalRevenue = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Needs Attention items calculation
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = (tasks || []).filter(t => t.due_date && t.due_date < today && t.status !== 'Completed' && t.status !== 'done');
  const overduePayments = (payments || []).filter(p => p.payment_status === 'Pending' && p.due_date && p.due_date < today);
  const unassignedLeads = (leads || []).filter(l => !l.assigned_to && l.status === 'New');

  const needsAttentionList = [
    ...overdueTasks.map(t => ({ id: `task-${t.id}`, title: `Overdue Task: "${t.title}"`, subtitle: `Due ${t.due_date}`, action: () => onSelectTask && onSelectTask(t) })),
    ...overduePayments.map(p => ({ id: `pay-${p.id}`, title: `Overdue Payment: Invoice #${p.invoice_no || p.id.slice(0, 6)}`, subtitle: `Amount ₹${p.amount}`, action: () => setPanel && setPanel('payments') })),
    ...unassignedLeads.map(l => ({ id: `lead-${l.id}`, title: `New Unassigned Lead: "${l.name}"`, subtitle: l.company || l.email, action: () => setPanel && setPanel('leads') })),
  ];

  // Pipeline Stages
  const pipelineStages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const pipelineStats = pipelineStages.map(stage => {
    const stageLeads = (leads || []).filter(l => (l.status || 'New').toLowerCase() === stage.toLowerCase());
    return {
      stage,
      count: stageLeads.length,
      value: stageLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0),
    };
  });

  // Chart Data
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
    <div className="space-y-5 py-1 font-sans">
      {/* 1. Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-gray-200/60">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            {getGreeting()}, {getDisplayName()}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Here's what needs your attention today.</p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          {['admin', 'sales', 'digital_marketer'].includes(role) && (
            <button
              onClick={() => setPanel && setPanel('leads')}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-subtle"
            >
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          )}
          {['admin', 'sales'].includes(role) && (
            <button
              onClick={() => setPanel && setPanel('clients')}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Revenue */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Revenue</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <Icon icon="heroicons:banknotes" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1.5">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">Total payments collected</p>
        </div>

        {/* Card 2: Active Clients */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Active Clients</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Icon icon="heroicons:building-office-2" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1.5">{activeClientsCount}</div>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">Active client organizations</p>
        </div>

        {/* Card 3: Active Leads */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Active Leads</span>
            <div className="w-7 h-7 rounded-md bg-orange-50 text-[#FF8A1F] flex items-center justify-center">
              <Icon icon="heroicons:user-group" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1.5">{activeLeadsCount}</div>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">Qualified opportunities</p>
        </div>

        {/* Card 4: Open Tasks */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Open Tasks</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Icon icon="heroicons:clipboard-document-check" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1.5">{openTasksCount}</div>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">Pending team tasks</p>
        </div>
      </div>

      {/* 3. Row 1: Revenue Overview (2 Cols) + Needs Attention (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Overview Chart */}
        <div className="lg:col-span-2 saas-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-[11px] text-gray-500">Recorded payment collection timeline</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md">
              {['7d', '30d', '3m', '6m', '12m'].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${
                    timeframe === t ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/40">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-[#FF8A1F] flex items-center justify-center mx-auto mb-2">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-800">No revenue data yet</h4>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1 mb-3">
                Record your first payment to start tracking real-time revenue analytics.
              </p>
              <button
                onClick={() => setPanel && setPanel('payments')}
                className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Icon icon="heroicons:credit-card" className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8A1F" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF8A1F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                  <Area type="monotone" dataKey="amount" stroke="#FF8A1F" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Needs Attention Panel (Compact empty state) */}
        <div className="saas-card p-5 border-l-4 border-l-[#FF8A1F] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="heroicons:exclamation-circle" className="w-4 h-4 text-[#FF8A1F]" />
                <h3 className="text-sm font-bold text-gray-900">Needs Attention</h3>
              </div>
              {needsAttentionList.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                  {needsAttentionList.length} items
                </span>
              )}
            </div>

            {needsAttentionList.length === 0 ? (
              <div className="py-6 text-center my-auto">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto mb-2">
                  <Icon icon="heroicons:check-badge" className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-900">You're all caught up</p>
                <p className="text-[11px] text-gray-500 mt-0.5">No action required at the moment.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {needsAttentionList.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    onClick={item.action}
                    className="p-2.5 rounded-lg bg-orange-50/60 hover:bg-orange-100/70 border border-orange-200/80 cursor-pointer transition-all"
                  >
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Row 2: Sales Pipeline (2 Cols) + Today's Work (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Pipeline */}
        {leadsEnabled ? (
          <div className="lg:col-span-2 saas-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Sales Pipeline</h3>
                <p className="text-[11px] text-gray-500">Distribution of leads across active stages</p>
              </div>
              <button onClick={() => setPanel && setPanel('leads')} className="btn-ghost text-xs py-1 px-2">
                View Pipeline →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {pipelineStats.map(s => (
                <div
                  key={s.stage}
                  onClick={() => setPanel && setPanel('leads')}
                  className="p-3 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-[10px] cursor-pointer transition-all text-center group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-orange-700 block truncate">
                    {s.stage}
                  </span>
                  <span className="text-base font-bold text-gray-900 group-hover:text-[#FF8A1F] mt-1 block">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 saas-card p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">CRM Operations Summary</h3>
            <p className="text-xs text-gray-500">Log client interactions and manage active task assignments.</p>
          </div>
        )}

        {/* Today's Work Widget */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Today's Work</h3>
              <p className="text-[11px] text-gray-500">Tasks & follow-ups</p>
            </div>
            <button onClick={() => setPanel && setPanel('tasks')} className="btn-ghost text-xs py-1 px-2">
              View all →
            </button>
          </div>

          <div className="space-y-2">
            {(tasks || []).slice(0, 4).map(t => {
              const isOverdue = t.due_date && t.due_date < today && t.status !== 'Completed' && t.status !== 'done';
              const isDone = t.status === 'Completed' || t.status === 'done';

              return (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                    isOverdue ? 'bg-rose-50/60 border-red-200' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    onClick={() => onSelectTask && onSelectTask(t)}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      isDone ? 'bg-emerald-500' : isOverdue ? 'bg-red-500 animate-pulse' : 'bg-[#FF8A1F]'
                    }`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {t.title}
                      </p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Icon icon="heroicons:calendar" className="w-3 h-3 text-gray-400" />
                        <span>{t.due_date || 'Today'}</span>
                        {isOverdue && <span className="text-red-600 font-bold ml-1">Overdue</span>}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (markTaskDone && !isDone) {
                        await markTaskDone(t.id);
                      }
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isDone ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={isDone ? 'Task completed' : 'Mark as done'}
                  >
                    <Icon icon={isDone ? 'heroicons:check-circle' : 'heroicons:circle'} className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {(tasks || []).length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                <Icon icon="heroicons:clipboard-document-check" className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p>No active tasks scheduled for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Row 3: Recent Activity Feed with Actionable Empty State */}
      <div className="saas-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            <p className="text-[11px] text-gray-500">Live audit log of team actions and lead conversions</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/40">
            <Icon icon="heroicons:clock" className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-gray-800">No recent activity</h4>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-0.5 mb-3">
              Activity will appear here automatically as your team works with clients and leads.
            </p>
            {leadsEnabled && (
              <button
                onClick={() => setPanel && setPanel('leads')}
                className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Icon icon="heroicons:plus" className="w-3.5 h-3.5 text-[#FF8A1F]" />
                <span>Add Lead</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {activities.slice(0, 4).map(act => (
              <div key={act.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-gray-400 text-[10px]">
                  <span className="font-semibold uppercase">{act.entity_type || 'System'}</span>
                  <span>{act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                </div>
                <p className="font-bold text-gray-900 truncate">{act.action}</p>
                <p className="text-[11px] text-gray-500 truncate">{act.details || 'CRM record update'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
