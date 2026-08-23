import React from 'react';
import { Icon } from '@iconify/react';
import { useDashboard } from '../hooks/useDashboard';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';

const formatCompact = (n) => {
  try {
    return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n || 0));
  } catch {
    const num = Number(n || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString('en-IN');
  }
};

const Dashboard = ({ onAddClient, onSelectTask }) => {
  const { user } = useAuth();
  const [range, setRange] = React.useState('month');
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const { stats, loading: statsLoading } = useDashboard(range);
  const { tasks, loading: tasksLoading } = useTasks({ limit: 5 });

  const pending = Number(stats?.pendingTasks || 0);
  const totalClients = Number(stats?.totalClients || 0);
  const walkIns = Number(stats?.walkIns || 0);
  // Assuming we might have revenue in stats later, but for now we'll show what we have.
  // If stats doesn't have revenue, we can either hide it or show 0.
  const revenue = Number(stats?.revenue || 0);

  const ranges = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: formatCompact(totalClients),
      change: '+0%', // Dynamic change would require historical data
      color: 'bg-white dark:bg-brand-black',
      text: 'text-brand-black dark:text-brand-white'
    },
    {
      title: 'Pending Tasks',
      value: formatCompact(pending),
      change: 'Active',
      color: 'bg-white dark:bg-brand-black',
      text: 'text-brand-black dark:text-brand-white'
    },
    {
      title: 'Walk-ins',
      value: formatCompact(walkIns),
      change: ranges.find(r => r.id === range)?.label || 'This Month',
      color: 'bg-white dark:bg-brand-black',
      text: 'text-brand-black dark:text-brand-white'
    },
    {
      title: 'Revenue',
      value: `₹${formatCompact(revenue)}`,
      change: 'Total',
      color: 'bg-white dark:bg-brand-black',
      text: 'text-brand-black dark:text-brand-white'
    }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0 font-sans">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black dark:text-brand-white">
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-brand-grey mt-1 text-sm">Here's what's happening today.</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setRangeOpen(!rangeOpen)}
            className="px-3 py-2 bg-white dark:bg-brand-black rounded-xl shadow-sm border border-brand-grey/10 text-xs font-medium text-brand-black dark:text-brand-white flex items-center gap-2 hover:shadow-md transition-all"
          >
            <Icon icon="mdi:calendar" className="w-3.5 h-3.5 text-brand-orange" />
            <span>{ranges.find(r => r.id === range)?.label}</span>
            <Icon icon="mdi:chevron-down" className={`w-3.5 h-3.5 text-brand-grey transition-transform ${rangeOpen ? 'rotate-180' : ''}`} />
          </button>

          {rangeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-brand-black rounded-xl shadow-xl border border-brand-grey/10 z-20 overflow-hidden">
                {ranges.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRange(r.id); setRangeOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-brand-grey/5 transition-colors flex items-center justify-between ${range === r.id ? 'font-bold text-brand-orange bg-brand-orange/5' : 'text-brand-black dark:text-brand-white'}`}
                  >
                    {r.label}
                    {range === r.id && <Icon icon="mdi:check" className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-3xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${card.color} border border-brand-grey/10`}
          >
            <div className="flex justify-end items-start mb-2">
              <div className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-grey/10 text-brand-grey">
                {card.change}
              </div>
            </div>

            <div className="flex flex-col">
              <div className={`text-2xl font-bold mb-0.5 ${card.text}`}>{card.value}</div>
              <div className={`text-xs font-medium opacity-80 ${card.text}`}>{card.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Tasks */}
        <div className="xl:col-span-2 bg-white dark:bg-brand-black rounded-3xl p-6 shadow-sm border border-brand-grey/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-brand-black dark:text-brand-white">Recent Tasks</h3>
            <div className="flex gap-2">
              <button className="p-1.5 rounded-lg hover:bg-brand-grey/5 text-brand-grey transition-colors">
                <Icon icon="mdi:filter-variant" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(tasks || []).slice(0, 5).map((t, i) => (
              <div key={t.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-brand-grey/5 transition-all cursor-pointer border border-transparent hover:border-brand-grey/10" onClick={() => onSelectTask && onSelectTask(t)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${i % 3 === 0 ? 'bg-blue-100 text-blue-600' :
                    i % 3 === 1 ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                    {t.title.charAt(0)}
                  </div>
                  <div>
                    <div className="text-brand-black dark:text-brand-white font-bold text-sm mb-0.5">{t.title}</div>
                    <div className="text-xs text-brand-grey flex items-center gap-1.5">
                      <Icon icon="mdi:calendar-clock" className="w-3 h-3" />
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${t.status === 'done' ? 'bg-green-100 text-green-700' :
                    t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                    {t.status?.replace('_', ' ') || 'Pending'}
                  </div>
                  <button className="p-1.5 rounded-full hover:bg-brand-grey/10 text-brand-grey opacity-0 group-hover:opacity-100 transition-all">
                    <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {(tasks || []).length === 0 && (
              <div className="text-center py-8 text-brand-grey text-sm">No recent tasks found</div>
            )}
          </div>
        </div>

        {/* Quick Actions / Overview Side Panel */}
        <div className="space-y-6">
          {/* Quick Actions Grid */}
          <div className="bg-white dark:bg-brand-black rounded-3xl p-6 shadow-sm border border-brand-grey/10">
            <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add Client', icon: 'mdi:account-plus', color: 'bg-blue-50 text-blue-600', action: onAddClient },
                { label: 'New Task', icon: 'mdi:checkbox-marked-circle-plus-outline', color: 'bg-orange-50 text-orange-600', action: () => onSelectTask && onSelectTask(null) }, // Pass null to create new
                // Removed placeholders for features not yet implemented to keep it clean
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-brand-white dark:bg-brand-grey/5 border border-transparent hover:border-brand-orange/20 hover:shadow-md transition-all group"
                >
                  <div className={`p-3 rounded-xl ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon icon={item.icon} className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-brand-black dark:text-brand-white text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Removed Efficiency Card as it was mock data */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
