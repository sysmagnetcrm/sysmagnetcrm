import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useReports } from '../hooks/useReports';
import { usePayments } from '../hooks/usePayments';
import { useSales } from '../hooks/useSales';
import { useLeads } from '../hooks/useLeads';
import { useClients } from '../hooks/useClients';
import { usePayroll } from '../hooks/usePayroll';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const { summary } = useReports();
  const { payments } = usePayments();
  const { deals } = useSales();
  const { leads } = useLeads();
  const { clients } = useClients();
  const { analytics: payrollAnalytics } = usePayroll();

  const analytics = useMemo(() => {
    const totalRevenue = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalPending = payments.reduce((sum, p) => sum + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0);
    const overduePayments = payments.filter(p => {
      const isOverdue = p.status !== 'Paid' && p.due_date && new Date(p.due_date) < new Date();
      return isOverdue;
    });
    const overdueAmount = overduePayments.reduce((sum, p) => sum + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0);

    const paidPayments = payments.filter(p => p.status === 'Paid').length;
    const partialPayments = payments.filter(p => p.status === 'Partial').length;
    const pendingPayments = payments.filter(p => p.status === 'Pending').length;

    const closedDeals = deals.filter(d => d.stage === 'Closed').length;
    const inProgressDeals = deals.filter(d => d.stage === 'In Progress').length;
    const newDeals = deals.filter(d => d.stage === 'New').length;

    const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
    const contactedLeads = leads.filter(l => l.status === 'Contacted').length;
    const newLeads = leads.filter(l => l.status === 'New').length;

    const conversion = leads.length > 0 ? Math.round((closedDeals / leads.length) * 100) : 0;

    const totalPayrollExpense = payrollAnalytics.totalPayroll || 0;
    const avgEmployeeSalary = payrollAnalytics.avgSalary || 0;
    const totalEmployees = payrollAnalytics.totalEmployees || 0;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalPayrollExpense) / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalPending,
      overdueAmount,
      overdueCount: overduePayments.length,
      paidPayments,
      partialPayments,
      pendingPayments,
      closedDeals,
      inProgressDeals,
      newDeals,
      qualifiedLeads,
      contactedLeads,
      newLeads,
      conversion,
      totalClients: clients.length,
      totalPayments: payments.length,
      totalPayrollExpense,
      avgEmployeeSalary,
      totalEmployees,
      profitMargin
    };
  }, [payments, deals, leads, clients, payrollAnalytics]);

  const revenueData = [
    { name: 'Paid', value: analytics.totalRevenue, color: '#10b981' },
    { name: 'Pending', value: analytics.totalPending, color: '#f59e0b' },
    { name: 'Overdue', value: analytics.overdueAmount, color: '#ef4444' },
  ];

  const paymentStatusData = [
    { name: 'Paid', value: analytics.paidPayments, color: '#10b981' },
    { name: 'Partial', value: analytics.partialPayments, color: '#f59e0b' },
    { name: 'Pending', value: analytics.pendingPayments, color: '#ef4444' },
  ];

  const salesFunnelData = [
    { name: 'New Leads', value: analytics.newLeads, stage: 'leads' },
    { name: 'Contacted', value: analytics.contactedLeads, stage: 'leads' },
    { name: 'Qualified', value: analytics.qualifiedLeads, stage: 'leads' },
    { name: 'New Deals', value: analytics.newDeals, stage: 'deals' },
    { name: 'In Progress', value: analytics.inProgressDeals, stage: 'deals' },
    { name: 'Closed', value: analytics.closedDeals, stage: 'deals' },
  ];

  const financialComparisonData = [
    { name: 'Revenue', value: analytics.totalRevenue, color: '#10b981' },
    { name: 'Payroll Expense', value: analytics.totalPayrollExpense, color: '#ef4444' },
    { name: 'Net Profit', value: Math.max(0, analytics.totalRevenue - analytics.totalPayrollExpense), color: '#3b82f6' },
  ];

  const departmentData = payrollAnalytics.departmentBreakdown || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Reports & Analytics</h1>
          <p className="text-brand-grey mt-1">
            Comprehensive business insights and payment analytics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${analytics.totalRevenue.toLocaleString()}`, icon: 'mdi:currency-inr', color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Pending Amount', value: `₹${analytics.totalPending.toLocaleString()}`, icon: 'mdi:alert-circle-outline', color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Conversion Rate', value: `${analytics.conversion}%`, icon: 'mdi:target', color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Overdue Amount', value: `₹${analytics.overdueAmount.toLocaleString()}`, icon: 'mdi:calendar-alert', color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Payroll Expense', value: `₹${analytics.totalPayrollExpense.toLocaleString()}`, icon: 'mdi:account-cash', color: 'text-purple-600', bg: 'bg-purple-100' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="soft-card p-6 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${stat.bg} dark:bg-opacity-20`}>
              <Icon icon={stat.icon} className={`w-6 h-6 ${stat.color} dark:text-opacity-80`} />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-brand-black dark:text-brand-white mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="soft-card p-6"
        >
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-6">Revenue Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {revenueData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm font-medium text-brand-grey">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payment Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="soft-card p-6"
        >
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-6">Payment Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentStatusData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" vertical={false} />
                <XAxis dataKey="name" className="text-xs font-bold text-brand-grey" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} />
                <YAxis className="text-xs font-bold text-brand-grey" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Sales Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="soft-card p-6"
      >
        <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-6">Sales Funnel Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesFunnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" vertical={false} />
              <XAxis dataKey="name" className="text-xs font-bold text-brand-grey" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} />
              <YAxis className="text-xs font-bold text-brand-grey" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {salesFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Payroll & Financial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="soft-card p-6"
        >
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-6">Revenue vs Payroll Expense</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" vertical={false} />
                <XAxis dataKey="name" className="text-xs font-bold text-brand-grey" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} />
                <YAxis className="text-xs font-bold text-brand-grey" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => `₹${value.toLocaleString()}`}
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {financialComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-brand-grey/5 rounded-xl border border-brand-grey/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-brand-grey">Profit Margin:</span>
              <span className={`font-bold text-lg ${analytics.profitMargin > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                {analytics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Department Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="soft-card p-6"
        >
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-6">Employee Distribution by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {departmentData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm font-medium text-brand-grey">
                  {item.department} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="soft-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Icon icon="mdi:account-group" className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-brand-black dark:text-brand-white">Client Overview</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Total Clients</span>
              <span className="font-bold text-brand-black dark:text-brand-white">{analytics.totalClients}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Active Deals</span>
              <span className="font-bold text-brand-black dark:text-brand-white">{analytics.inProgressDeals + analytics.newDeals}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Closed Deals</span>
              <span className="font-bold text-green-600 dark:text-green-400">{analytics.closedDeals}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="soft-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-xl text-green-600">
              <Icon icon="mdi:trending-up" className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-brand-black dark:text-brand-white">Lead Performance</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Total Leads</span>
              <span className="font-bold text-brand-black dark:text-brand-white">{leads.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Qualified</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{analytics.qualifiedLeads}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Conversion Rate</span>
              <span className="font-bold text-green-600 dark:text-green-400">{analytics.conversion}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="soft-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Icon icon="mdi:check-circle-outline" className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-brand-black dark:text-brand-white">Payment Health</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Total Payments</span>
              <span className="font-bold text-brand-black dark:text-brand-white">{analytics.totalPayments}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Overdue Count</span>
              <span className="font-bold text-red-600 dark:text-red-400">{analytics.overdueCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-grey/5 rounded-xl">
              <span className="text-sm font-medium text-brand-grey">Collection Rate</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {analytics.totalRevenue + analytics.totalPending > 0
                  ? Math.round((analytics.totalRevenue / (analytics.totalRevenue + analytics.totalPending)) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
