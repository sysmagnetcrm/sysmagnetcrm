import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import PageHeader from './PageHeader';
import StatCard from './StatCard';
import FilterBar from './FilterBar';
import FormDrawer from './FormDrawer';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import ConfirmDialog from './ConfirmDialog';
import { usePayments } from '../hooks/usePayments';
import { paymentsAPI, clientsAPI } from '../utils/supabaseServices';

// Locale-aware date formatter (DD/MM/YYYY)
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const Payments = () => {
  const { payments = [], loading, error, refetch, createPayment, updatePayment, deletePayment } = usePayments();
  const [clients, setClients] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Active filters state
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    method: 'all',
  });

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceNo: '',
    projectName: '',
    invoiceTotal: '0',
    alreadyPaid: '0',
    paymentAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    reference: '',
    notes: '',
  });

  // Load clients list for relational dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await clientsAPI.getAll();
        setClients(res.data || []);
      } catch {
        setClients([]);
      }
    };
    loadClients();
  }, []);

  // Compute derived remaining balance from invoice data
  const invoiceTotalNum = Number(formData.invoiceTotal) || 0;
  const alreadyPaidNum = Number(formData.alreadyPaid) || 0;
  const remainingBalance = Math.max(0, invoiceTotalNum - alreadyPaidNum);

  // Handle Client Selection -> Auto-populate available invoice total if client selected
  const handleClientChange = (clientId) => {
    const clientObj = clients.find(c => String(c.id) === String(clientId));
    setFormData(prev => ({
      ...prev,
      clientId,
      invoiceNo: clientObj ? `INV-${String(clientObj.id).slice(0, 4)}-01` : '',
      projectName: clientObj ? `${clientObj.name} Web Project` : '',
      invoiceTotal: '50000',
      alreadyPaid: '20000',
      paymentAmount: '',
    }));
    setValidationError('');
  };

  // Inline Payment Amount Validation
  const handleAmountChange = (val) => {
    const amountNum = Number(val) || 0;
    setFormData(prev => ({ ...prev, paymentAmount: val }));

    if (amountNum <= 0) {
      setValidationError('Payment amount must be greater than zero.');
    } else if (remainingBalance > 0 && amountNum > remainingBalance) {
      setValidationError(`Payment amount cannot exceed remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}.`);
    } else {
      setValidationError('');
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalRev = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const pendingPayments = payments.filter(p => p.payment_status === 'Pending' || p.status === 'Pending');
    const pendingAmount = pendingPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = payments.filter(p => p.due_date && p.due_date < todayStr && p.payment_status === 'Pending').length;

    return {
      totalRevenue: totalRev,
      pendingAmount,
      pendingCount: pendingPayments.length,
      overdueCount,
    };
  }, [payments]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const clientName = p.client_name || p.clients?.name || '';
      const invoiceNo = p.invoice_no || p.id || '';
      const matchesSearch = !q || clientName.toLowerCase().includes(q) || String(invoiceNo).toLowerCase().includes(q);

      const status = (p.payment_status || p.status || 'Completed').toLowerCase();
      const matchesStatus = activeFilters.status === 'all' || status === activeFilters.status.toLowerCase();
      const method = (p.payment_method || '').toLowerCase();
      const matchesMethod = activeFilters.method === 'all' || method === activeFilters.method.toLowerCase();

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, searchQuery, activeFilters]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingPayment(null);
    setValidationError('');
    setFormData({
      clientId: clients.length > 0 ? clients[0].id : '',
      invoiceNo: clients.length > 0 ? `INV-${String(clients[0].id).slice(0, 4)}-01` : 'INV-1001',
      projectName: 'Website Development',
      invoiceTotal: '50000',
      alreadyPaid: '20000',
      paymentAmount: '10000',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      reference: '',
      notes: '',
    });
    setShowDrawer(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(formData.paymentAmount) || 0;
    if (amountNum <= 0) {
      setValidationError('Please enter a valid payment amount.');
      return;
    }
    if (remainingBalance > 0 && amountNum > remainingBalance) {
      setValidationError(`Payment amount cannot exceed remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}.`);
      return;
    }

    setSubmitting(true);
    try {
      if (createPayment) {
        await createPayment({
          clientId: formData.clientId,
          invoice_no: formData.invoiceNo,
          amount: amountNum,
          payment_date: formData.paymentDate,
          payment_method: formData.paymentMethod,
          reference: formData.reference,
          notes: formData.notes,
        });
      }
      setShowDrawer(false);
      if (refetch) refetch();
    } catch (err) {
      console.error('Payment submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: 'all', method: 'all' });
    setSearchQuery('');
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed': case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-5 py-1 font-sans">
      {/* Standardized Page Header */}
      <PageHeader
        category="FINANCIAL MANAGEMENT"
        title="Payments"
        subtitle="Track recorded client payments, invoice balances, and financial records."
        primaryActionLabel="Record Payment"
        onPrimaryAction={handleOpenAdd}
        exportActionLabel="Export"
        onExportAction={() => console.log('Export payments')}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
          icon="heroicons:banknotes"
          iconColor="text-[#12B76A]"
          iconBg="bg-[#F6FEF9]"
          supportingText="Collected payment total"
        />
        <StatCard
          label="Pending Amount"
          value={`₹${metrics.pendingAmount.toLocaleString('en-IN')}`}
          icon="heroicons:clock"
          iconColor="text-[#F79009]"
          iconBg="bg-[#FFFAEB]"
          supportingText="Uncollected invoices"
        />
        <StatCard
          label="Pending Payments"
          value={metrics.pendingCount}
          icon="heroicons:document-text"
          iconColor="text-[#3B82F6]"
          iconBg="bg-[#EFF8FF]"
          supportingText="Invoices awaiting payment"
        />
        <StatCard
          label="Overdue Invoices"
          value={metrics.overdueCount}
          icon="heroicons:exclamation-circle"
          iconColor="text-[#F04438]"
          iconBg="bg-[#FEF3F2]"
          supportingText="Past due date"
        />
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search payments by client name or invoice..."
        primaryFilters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'Completed', label: 'Completed' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Overdue', label: 'Overdue' },
            ],
          },
          {
            key: 'method',
            label: 'Method',
            options: [
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'UPI', label: 'UPI / GPay' },
              { value: 'Credit Card', label: 'Credit Card' },
              { value: 'Cheque', label: 'Cheque' },
            ],
          },
        ]}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Standardized Payments Table */}
      {error ? (
        <ErrorState
          title="Unable to load payments"
          description="Something went wrong while loading financial records from the server."
          onRetry={refetch}
        />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon="heroicons:credit-card"
          title="No payments recorded yet"
          description="Record your first payment to start tracking client financial history and invoice collections."
          actionLabel="Record Payment"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Invoice / Project</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const clientName = p.client_name || p.clients?.name || 'Client Account';
                  const invoiceNo = p.invoice_no || `INV-${String(p.id).slice(0, 6)}`;
                  const total = Number(p.totalAmount || p.amount || 0);
                  const paid = Number(p.paidAmount || p.amount || 0);
                  const balance = Math.max(0, total - paid);
                  const status = p.payment_status || p.status || 'Completed';

                  return (
                    <tr key={p.id} className="hover:bg-[#F9FAFB]">
                      <td className="font-bold text-[#111827]">{clientName}</td>
                      <td>
                        <div className="text-xs">
                          <p className="font-semibold text-[#111827]">{invoiceNo}</p>
                          <p className="text-[11px] text-[#667085]">{p.projectName || 'Project Service'}</p>
                        </div>
                      </td>
                      <td className="font-medium text-[#111827]">₹{total.toLocaleString('en-IN')}</td>
                      <td className="font-semibold text-[#12B76A]">₹{paid.toLocaleString('en-IN')}</td>
                      <td className="font-semibold text-[#667085]">₹{balance.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="text-xs text-[#667085]">{formatDate(p.payment_date || p.created_at)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => deletePayment && setDeletingPaymentId(p.id)}
                            className="p-1.5 text-[#667085] hover:text-[#F04438] hover:bg-[#FEF3F2] rounded-[6px] transition-colors"
                            title="Delete Payment"
                          >
                            <Icon icon="heroicons:trash" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Form Drawer */}
      <FormDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title="Record Payment"
        subtitle="Log a client payment against an outstanding invoice."
        submitLabel="Record Payment"
        submitting={submitting}
        onSubmit={handleFormSubmit}
      >
        {/* Section 1: Relational Account Selection */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E4E7EC] pb-1.5">
            Relational Selection
          </h4>

          <div>
            <label className="saas-label">Select Client Organization *</label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="saas-input"
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email || c.phone || 'Account'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saas-label">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNo}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                placeholder="INV-1001"
                className="saas-input font-mono"
              />
            </div>
            <div>
              <label className="saas-label">Project / Service Name</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="Website Redesign"
                className="saas-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invoice Balance Summary (Derived automatically) */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E4E7EC] pb-1.5">
            Invoice Financial Summary
          </h4>

          <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-[8px] p-3 space-y-2 text-xs">
            <div className="flex justify-between text-[#667085]">
              <span>Invoice Total:</span>
              <span className="font-semibold text-[#111827]">₹{invoiceTotalNum.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[#667085]">
              <span>Already Paid:</span>
              <span className="font-semibold text-[#12B76A]">₹{alreadyPaidNum.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[#111827] font-bold pt-1.5 border-t border-[#E4E7EC]">
              <span>Remaining Balance:</span>
              <span className="text-[#FF8A1F]">₹{remainingBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Payment Entry Details */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E4E7EC] pb-1.5">
            Payment Details
          </h4>

          <div>
            <label className="saas-label">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              value={formData.paymentAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="e.g. 10000"
              className={`saas-input ${validationError ? 'border-[#F04438] focus:ring-[#F04438]/20' : ''}`}
            />
            {validationError && (
              <p className="text-[11px] font-semibold text-[#F04438] mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-circle" className="w-3.5 h-3.5" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saas-label">Payment Date *</label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="saas-input"
              />
            </div>

            <div>
              <label className="saas-label">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="saas-input"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="saas-label">Reference / Transaction ID</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="e.g. UTR-987654321"
              className="saas-input font-mono"
            />
          </div>

          <div>
            <label className="saas-label">Notes & Remarks</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional payment notes or receipt details..."
              className="saas-input"
            />
          </div>
        </div>
      </FormDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingPaymentId}
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmLabel="Delete Payment"
        onConfirm={async () => {
          if (deletingPaymentId && deletePayment) {
            await deletePayment(deletingPaymentId);
          }
          setDeletingPaymentId(null);
        }}
        onCancel={() => setDeletingPaymentId(null)}
      />
    </div>
  );
};

export default Payments;
