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

const COLORS = ['#FF8A1F', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Reports() {
  const { summary } = useReports();
  const { payments: rawPayments } = usePayments();
  const { deals: rawDeals } = useSales();
  const { leads: rawLeads } = useLeads();
  const { clients: rawClients } = useClients();
  const { analytics: payrollAnalytics } = usePayroll();

  // Defensive array sanitization
  const payments = useMemo(() => (Array.isArray(rawPayments) ? rawPayments : []), [rawPayments]);
  const deals = useMemo(() => (Array.isArray(rawDeals) ? rawDeals : []), [rawDeals]);
  const leads = useMemo(() => (Array.isArray(rawLeads) ? rawLeads : []), [rawLeads]);
  const clients = useMemo(() => (Array.isArray(rawClients) ? rawClients : []), [rawClients]);

  const analytics = useMemo(() => {
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.paidAmount || p.amount || 0) || 0), 0);
    const totalPending = payments.reduce((sum, p) => sum + Math.max(0, (Number(p.totalAmount || p.amount || 0) - Number(p.paidAmount || 0))), 0);
    
    const overduePayments = payments.filter(p => {
      const isOverdue = p.status !== 'Paid' && p.due_date && new Date(p.due_date) < new Date();
      return isOverdue;
    });
    const overdueAmount = overduePayments.reduce((sum, p) => sum + Math.max(0, (Number(p.totalAmount || p.amount || 0) - Number(p.paidAmount || 0))), 0);

    const paidPayments = payments.filter(p => p.status === 'Paid').length;
    const partialPayments = payments.filter(p => p.status === 'Partial').length;
    const pendingPayments = payments.filter(p => p.status === 'Pending').length;

    const closedDeals = deals.filter(d => d.stage === 'Closed' || d.stage === 'Won').length;
    const inProgressDeals = deals.filter(d => d.stage === 'In Progress' || d.stage === 'Proposal').length;
    const newDeals = deals.filter(d => d.stage === 'New').length;

    const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
    const contactedLeads = leads.filter(l => l.status === 'Contacted').length;
    const newLeads = leads.filter(l => l.status === 'New').length;

    const conversion = leads.length > 0 ? Math.round((closedDeals / leads.length) * 100) : 0;

    const safePayroll = payrollAnalytics || {};
    const totalPayrollExpense = Number(safePayroll.totalPayroll || 0);
    const avgEmployeeSalary = Number(safePayroll.avgSalary || 0);
    const totalEmployees = Number(safePayroll.totalEmployees || 0);
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
    { name: 'New Leads', value: analytics.newLeads },
    { name: 'Contacted', value: analytics.contactedLeads },
    { name: 'Qualified', value: analytics.qualifiedLeads },
    { name: 'New Deals', value: analytics.newDeals },
    { name: 'In Progress', value: analytics.inProgressDeals },
    { name: 'Closed', value: analytics.closedDeals },
  ];

  const financialComparisonData = [
    { name: 'Revenue', value: analytics.totalRevenue, color: '#10b981' },
    { name: 'Payroll Expense', value: analytics.totalPayrollExpense, color: '#ef4444' },
    { name: 'Net Profit', value: Math.max(0, analytics.totalRevenue - analytics.totalPayrollExpense), color: '#FF8A1F' },
  ];

  // Fix department data to ALWAYS have a valid 'name' string property for Recharts tooltips/legends
  const departmentData = useMemo(() => {
    const raw = (payrollAnalytics && Array.isArray(payrollAnalytics.departmentBreakdown))
      ? payrollAnalytics.departmentBreakdown
      : [];
    if (raw.length === 0) {
      return [{ name: 'General', department: 'General', count: 1 }];
    }
    return raw.map(item => ({
      name: String(item.department || item.name || 'General'),
      department: String(item.department || item.name || 'General'),
      count: Number(item.count || item.value || 0),
    }));
  }, [payrollAnalytics]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-[#E4E7EC]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Reports & Analytics</h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">Comprehensive business insights, financial performance, and lead conversion analytics.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${analytics.totalRevenue.toLocaleString('en-IN')}`, icon: 'heroicons:banknotes', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Amount', value: `₹${analytics.totalPending.toLocaleString('en-IN')}`, icon: 'heroicons:clock', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Conversion Rate', value: `${analytics.conversion}%`, icon: 'heroicons:arrow-trending-up', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Overdue Amount', value: `₹${analytics.overdueAmount.toLocaleString('en-IN')}`, icon: 'heroicons:exclamation-circle', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Payroll Expense', value: `₹${analytics.totalPayrollExpense.toLocaleString('en-IN')}`, icon: 'heroicons:credit-card', color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="saas-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <Icon icon={stat.icon} className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-[#111827] mt-3">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="saas-card p-6 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Revenue Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueData}
                  nameKey="name"
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${Number(value || 0).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E4E7EC', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {revenueData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-[#667085]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="saas-card p-6 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Payment Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                <XAxis dataKey="name" tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Funnel */}
      <div className="saas-card p-6">
        <h3 className="text-base font-semibold text-[#111827] mb-4">Sales Funnel Analysis</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesFunnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
              <XAxis dataKey="name" tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {salesFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Comparison & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Payroll */}
        <div className="saas-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#111827] mb-4">Revenue vs Payroll Expense</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                  <XAxis dataKey="name" tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => `₹${Number(value || 0).toLocaleString('en-IN')}`}
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {financialComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 p-4 bg-[#F9FAFB] rounded-[8px] border border-[#EAECF0]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085]">Profit Margin Ratio:</span>
              <span className={`font-bold text-base ${analytics.profitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {analytics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="saas-card p-6 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Employee Distribution by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  nameKey="name"
                  dataKey="count"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} employees`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {departmentData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-medium text-[#667085]">
                  {item.name} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon icon="heroicons:building-office-2" className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-[#111827] text-sm">Client Overview</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Total Clients</span>
              <span className="font-bold text-[#111827]">{analytics.totalClients}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Active Deals</span>
              <span className="font-bold text-[#111827]">{analytics.inProgressDeals + analytics.newDeals}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Closed Deals</span>
              <span className="font-bold text-emerald-600">{analytics.closedDeals}</span>
            </div>
          </div>
        </div>

        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon icon="heroicons:arrow-trending-up" className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-[#111827] text-sm">Lead Performance</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Total Leads</span>
              <span className="font-bold text-[#111827]">{leads.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Qualified Leads</span>
              <span className="font-bold text-blue-600">{analytics.qualifiedLeads}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Conversion Rate</span>
              <span className="font-bold text-emerald-600">{analytics.conversion}%</span>
            </div>
          </div>
        </div>

        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Icon icon="heroicons:check-circle" className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-[#111827] text-sm">Payment Health</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Total Invoices</span>
              <span className="font-bold text-[#111827]">{analytics.totalPayments}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Overdue Invoices</span>
              <span className="font-bold text-rose-600">{analytics.overdueCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-[8px]">
              <span className="text-xs font-medium text-[#667085]">Collection Rate</span>
              <span className="font-bold text-emerald-600">
                {analytics.totalRevenue + analytics.totalPending > 0
                  ? Math.round((analytics.totalRevenue / (analytics.totalRevenue + analytics.totalPending)) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
