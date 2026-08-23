import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useSales } from '../hooks/useSales';
import { usePayments } from '../hooks/usePayments';
import { useClients } from '../hooks/useClients';

const stageOrder = ['Lead Captured', 'Contacted', 'Proposal Sent', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

export default function Sales() {
  const { deals } = useSales();
  const { payments } = usePayments();
  const { clients } = useClients();

  const paymentSummary = useMemo(() => {
    return deals.map(deal => {
      const relevant = payments.filter(p =>
        p.clientName === deal.clientName ||
        (p.clientId && clients.find(c => c.id === p.clientId && c.name === deal.clientName))
      );

      const paid = relevant.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      const total = relevant.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

      return {
        id: deal.id,
        clientName: deal.clientName,
        projectName: relevant.find(p => p.projectName)?.projectName || deal.clientName,
        stage: deal.stage,
        dealValue: deal.dealValue || 0,
        paid,
        pending: Math.max(total - paid, 0),
        createdAt: deal.created_at
      };
    });
  }, [deals, payments, clients]);

  const sorted = [...paymentSummary].sort((a, b) => {
    const stageDiff = stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
    if (stageDiff !== 0) return stageDiff;
    return (b.dealValue || 0) - (a.dealValue || 0);
  });

  const totals = sorted.reduce((acc, item) => {
    acc.value += item.dealValue || 0;
    acc.paid += item.paid || 0;
    acc.pending += item.pending || 0;
    return acc;
  }, { value: 0, paid: 0, pending: 0 });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Sales Overview</h1>
          <p className="text-brand-grey mt-1">
            Lead conversions, deal values, and payment progress at a glance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="soft-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon icon="mdi:chart-line" className="w-24 h-24 text-brand-orange" />
          </div>
          <span className="text-sm font-bold text-brand-grey uppercase tracking-wider z-10">Total Pipeline Value</span>
          <div className="text-3xl font-bold text-brand-black dark:text-brand-white z-10">
            ₹{totals.value.toLocaleString()}
          </div>
        </div>
        <div className="soft-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon icon="mdi:cash-check" className="w-24 h-24 text-green-500" />
          </div>
          <span className="text-sm font-bold text-brand-grey uppercase tracking-wider z-10">Collected</span>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 z-10">
            ₹{totals.paid.toLocaleString()}
          </div>
        </div>
        <div className="soft-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon icon="mdi:clock-alert-outline" className="w-24 h-24 text-amber-500" />
          </div>
          <span className="text-sm font-bold text-brand-grey uppercase tracking-wider z-10">Outstanding</span>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 z-10">
            ₹{totals.pending.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="soft-card overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-6 py-4 text-xs font-bold text-brand-grey uppercase tracking-wider bg-brand-grey/5 border-b border-brand-grey/10">
          <span className="col-span-2 md:col-span-1">Client</span>
          <span className="hidden md:block">Project</span>
          <span className="hidden md:block">Stage</span>
          <span className="text-right">Deal Value</span>
          <span className="text-right">Paid</span>
          <span className="text-right">Pending</span>
        </div>
        <div className="divide-y divide-brand-grey/10">
          {sorted.length === 0 ? (
            <div className="px-6 py-12 text-center text-brand-grey flex flex-col items-center">
              <Icon icon="mdi:file-document-outline" className="w-12 h-12 mb-2 opacity-50" />
              No deals in the pipeline yet.
            </div>
          ) : (
            sorted.map(item => (
              <div key={item.id} className="grid grid-cols-6 gap-4 px-6 py-5 text-sm hover:bg-brand-grey/5 transition-colors items-center group">
                <div className="col-span-2 md:col-span-1 flex items-center gap-3 text-brand-black dark:text-brand-white">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shadow-sm">
                    {item.clientName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold truncate">{item.clientName}</span>
                </div>
                <div className="hidden md:block text-brand-grey truncate">{item.projectName}</div>
                <div className="hidden md:block">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${item.stage === 'Closed-Won' ? 'bg-green-100 text-green-700' :
                      item.stage === 'Closed-Lost' ? 'bg-red-100 text-red-700' :
                        'bg-brand-grey/10 text-brand-grey'
                    }`}>
                    {item.stage}
                  </span>
                </div>
                <div className="text-right font-medium text-brand-black dark:text-brand-white">
                  ₹{item.dealValue.toLocaleString()}
                </div>
                <div className="text-right font-medium text-green-600 dark:text-green-400">
                  ₹{item.paid.toLocaleString()}
                </div>
                <div className={`text-right font-medium ${item.pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-brand-grey'}`}>
                  ₹{item.pending.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
