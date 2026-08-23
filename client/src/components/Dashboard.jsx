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
  const { tasks, markTaskDone, loading: tasksLoading } = useTasks({}, true);
  const leadsEnabled = ['admin', 'sales', 'digital_marketer'].includes(role);
  const { leads, loading: leadsLoading } = useLeads({}, leadsEnabled);
  const { clients, loading: clientsLoading } = useClients({}, true);

  // Fetch real payments and audit activity feed
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

  // Simple clean greeting (No raw emails, no excessive emojis)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Admin';
  };

  // Metrics (Strictly Real Data)
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

  // Real Chart Data
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
    <div className="space-y-6 py-1 font-sans">
      {/* 1. Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#E4E7EC]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
            {getGreeting()}, {getDisplayName()}
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">Here's what needs your attention today.</p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          {['admin', 'sales', 'digital_marketer'].includes(role) && (
            <button
              onClick={() => setPanel && setPanel('leads')}
              className="btn-primary"
            >
              <Icon icon="heroicons:plus" className="w-3.5 h-3.5 mr-1.5" />
              <span>Add Lead</span>
            </button>
          )}
          {['admin', 'sales'].includes(role) && (
            <button
              onClick={() => setPanel && setPanel('clients')}
              className="btn-secondary"
            >
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact KPI Cards (1. KPI in Hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">Revenue</span>
            <Icon icon="heroicons:banknotes" className="w-4 h-4 text-[#12B76A]" />
          </div>
          <div className="text-xl font-bold text-[#111827] mt-1.5">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-[#667085] mt-0.5 truncate">Total payments collected</p>
        </div>

        {/* Card 2: Active Clients */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">Active Clients</span>
            <Icon icon="heroicons:building-office-2" className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-xl font-bold text-[#111827] mt-1.5">{activeClientsCount}</div>
          <p className="text-[11px] text-[#667085] mt-0.5 truncate">Active client organizations</p>
        </div>

        {/* Card 3: Active Leads */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">Active Leads</span>
            <Icon icon="heroicons:user-group" className="w-4 h-4 text-[#FF8A1F]" />
          </div>
          <div className="text-xl font-bold text-[#111827] mt-1.5">{activeLeadsCount}</div>
          <p className="text-[11px] text-[#667085] mt-0.5 truncate">Qualified opportunities</p>
        </div>

        {/* Card 4: Open Tasks */}
        <div className="saas-card p-4 hover:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">Open Tasks</span>
            <Icon icon="heroicons:clipboard-document-check" className="w-4 h-4 text-[#F79009]" />
          </div>
          <div className="text-xl font-bold text-[#111827] mt-1.5">{openTasksCount}</div>
          <p className="text-[11px] text-[#667085] mt-0.5 truncate">Pending team tasks</p>
        </div>
      </div>

      {/* 3. Row 1: Needs Attention (2 in Hierarchy) & Revenue Overview (3 in Hierarchy) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Needs Attention Panel (2 in Hierarchy) */}
        <div className="saas-card p-5 border-l-[3px] border-l-[#FF8A1F] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="heroicons:exclamation-circle" className="w-4 h-4 text-[#FF8A1F]" />
                <h3 className="text-sm font-bold text-[#111827]">Needs Attention</h3>
              </div>
              {needsAttentionList.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF4E8] text-[#D96F0B] rounded-full border border-[#FEDF89]/60">
                  {needsAttentionList.length} items
                </span>
              )}
            </div>

            {needsAttentionList.length === 0 ? (
              <div className="py-5 text-center my-auto">
                <div className="w-7 h-7 rounded-full bg-[#F6FEF9] text-[#12B76A] flex items-center justify-center mx-auto mb-1.5">
                  <Icon icon="heroicons:check-badge" className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-[#111827]">✓ You're all caught up</p>
                <p className="text-[11px] text-[#667085] mt-0.5">No items require your attention.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {needsAttentionList.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    onClick={item.action}
                    className="p-2.5 rounded-[8px] bg-[#FFF4E8]/60 hover:bg-[#FFF4E8] border border-[#FEDF89]/60 cursor-pointer transition-all"
                  >
                    <p className="text-xs font-semibold text-[#111827] truncate">{item.title}</p>
                    <p className="text-[11px] text-[#667085] mt-0.5">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue Overview Chart (3 in Hierarchy) */}
        <div className="lg:col-span-2 saas-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Revenue Overview</h3>
              <p className="text-[11px] text-[#667085]">Recorded payment collection timeline</p>
            </div>
            <div className="flex items-center gap-1 bg-[#F2F4F7] p-0.5 rounded-[6px]">
              {['7d', '30d', '3m', '6m', '12m'].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-[4px] transition-all ${
                    timeframe === t ? 'bg-white text-[#111827] shadow-2xs' : 'text-[#667085] hover:text-[#111827]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-[#E4E7EC] rounded-[8px] bg-[#F9FAFB]/50">
              <Icon icon="heroicons:chart-bar" className="w-6 h-6 text-[#98A2B3] mx-auto mb-2" />
              <h4 className="text-xs font-bold text-[#111827]">No revenue data yet</h4>
              <p className="text-[11px] text-[#667085] max-w-xs mx-auto mt-0.5 mb-3">
                Record your first payment to start tracking revenue.
              </p>
              <button
                onClick={() => setPanel && setPanel('payments')}
                className="btn-primary"
              >
                <Icon icon="heroicons:credit-card" className="w-3.5 h-3.5 mr-1.5" />
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
                  <XAxis dataKey="date" stroke="#98A2B3" fontSize={10} tickLine={false} />
                  <YAxis stroke="#98A2B3" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                  <Area type="monotone" dataKey="amount" stroke="#FF8A1F" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 4. Row 2: Sales Pipeline (4 in Hierarchy) & Today's Work (5 in Hierarchy) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Pipeline (4 in Hierarchy) */}
        {leadsEnabled ? (
          <div className="lg:col-span-2 saas-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Sales Pipeline</h3>
                <p className="text-[11px] text-[#667085]">Distribution of leads across active stages</p>
              </div>
              <button onClick={() => setPanel && setPanel('leads')} className="btn-ghost">
                View Pipeline →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {pipelineStats.map(s => (
                <div
                  key={s.stage}
                  onClick={() => setPanel && setPanel('leads')}
                  className="p-3 bg-[#F9FAFB] hover:bg-[#FFF4E8] border border-[#E4E7EC] hover:border-orange-200 rounded-[8px] cursor-pointer transition-all text-center group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] group-hover:text-[#D96F0B] block truncate">
                    {s.stage}
                  </span>
                  <span className="text-base font-bold text-[#111827] group-hover:text-[#FF8A1F] mt-1 block">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 saas-card p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-1">CRM Operations Summary</h3>
            <p className="text-xs text-[#667085]">Log client interactions and manage active task assignments.</p>
          </div>
        )}

        {/* Today's Work (5 in Hierarchy) */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Today's Work</h3>
              <p className="text-[11px] text-[#667085]">Tasks & follow-ups</p>
            </div>
            <button onClick={() => setPanel && setPanel('tasks')} className="btn-ghost">
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
                  className={`p-2.5 rounded-[8px] border transition-all flex items-center justify-between ${
                    isOverdue ? 'bg-[#FEF3F2] border-[#FECDCA]' : 'bg-white border-[#E4E7EC] hover:border-gray-300'
                  }`}
                >
                  <div
                    onClick={() => onSelectTask && onSelectTask(t)}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      isDone ? 'bg-[#12B76A]' : isOverdue ? 'bg-[#F04438]' : 'bg-[#FF8A1F]'
                    }`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-[#98A2B3]' : 'text-[#111827]'}`}>
                        {t.title}
                      </p>
                      <p className="text-[10px] text-[#667085] flex items-center gap-1 mt-0.5">
                        <Icon icon="heroicons:calendar" className="w-3 h-3 text-[#98A2B3]" />
                        <span>{t.due_date || 'Today'}</span>
                        {isOverdue && <span className="text-[#F04438] font-bold ml-1">Overdue</span>}
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
                    className={`p-1 rounded-[4px] transition-colors ${
                      isDone ? 'text-[#12B76A] bg-[#F6FEF9]' : 'text-[#98A2B3] hover:text-[#12B76A] hover:bg-[#F6FEF9]'
                    }`}
                    title={isDone ? 'Task completed' : 'Mark as done'}
                  >
                    <Icon icon={isDone ? 'heroicons:check-circle' : 'heroicons:circle'} className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {(tasks || []).length === 0 && (
              <div className="py-6 text-center text-xs text-[#667085]">
                <p className="font-semibold text-[#111827]">You're all caught up.</p>
                <p className="text-[11px] text-[#98A2B3] mt-0.5">No tasks need your attention today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Row 3: Recent Activity (6 in Hierarchy) */}
      <div className="saas-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Recent Activity</h3>
            <p className="text-[11px] text-[#667085]">Live team actions and audit activity log</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-[#E4E7EC] rounded-[8px] bg-[#F9FAFB]/50">
            <Icon icon="heroicons:clock" className="w-6 h-6 text-[#98A2B3] mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-[#111827]">No recent activity</h4>
            <p className="text-[11px] text-[#667085] max-w-xs mx-auto mt-0.5 mb-3">
              Activity will appear here as your team works with clients and leads.
            </p>
            {leadsEnabled && (
              <button
                onClick={() => setPanel && setPanel('leads')}
                className="btn-secondary"
              >
                <Icon icon="heroicons:plus" className="w-3.5 h-3.5 mr-1.5 text-[#FF8A1F]" />
                <span>Add Lead</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {activities.slice(0, 4).map(act => (
              <div key={act.id} className="p-3 rounded-[8px] bg-[#F9FAFB] border border-[#E4E7EC] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#98A2B3] text-[10px]">
                  <span className="font-semibold uppercase">{act.entity_type || 'System'}</span>
                  <span>{act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                </div>
                <p className="font-bold text-[#111827] truncate">{act.action}</p>
                <p className="text-[11px] text-[#667085] truncate">{act.details || 'CRM record update'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
