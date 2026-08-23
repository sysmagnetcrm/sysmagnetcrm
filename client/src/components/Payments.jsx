import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { usePayments } from '../hooks/usePayments';
import { paymentsAPI, clientsAPI } from '../utils/supabaseServices';

const EditPaymentModal = ({ isOpen, onClose, payment, onSave }) => {
  const [form, setForm] = useState({
    clientId: '',
    projectName: '',
    totalAmount: '',
    paidAmount: '',
    balance: '',
    dueDate: ''
  });
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (payment) {
      setForm({
        clientId: payment.clientId || '',
        projectName: payment.projectName || '',
        totalAmount: payment.totalAmount || '',
        paidAmount: payment.paidAmount || '',
        balance: (Number(payment.totalAmount || 0) - Number(payment.paidAmount || 0)).toString(),
        dueDate: payment.due_date ? payment.due_date.substring(0, 10) : ''
      });
    }
  }, [payment]);

  React.useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const res = await clientsAPI.getAll();
          setClients(res.data || []);
        } catch {
          setClients([]);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen || !payment) return null;

  const updateTotal = (value) => {
    const total = value;
    const totalNum = Number(total) || 0;
    const paid = Math.min(Number(form.paidAmount) || 0, totalNum);
    const balance = totalNum - paid;
    setForm(prev => ({
      ...prev,
      totalAmount: total,
      paidAmount: paid.toString(),
      balance: balance.toString()
    }));
  };

  const updatePaid = (value) => {
    const paid = Number(value) || 0;
    const total = Number(form.totalAmount) || 0;
    const safePaid = Math.min(paid, total);
    const balance = total - safePaid;
    setForm(prev => ({
      ...prev,
      paidAmount: safePaid.toString(),
      balance: balance.toString()
    }));
  };

  const updateBalance = (value) => {
    const balance = Number(value) || 0;
    const total = Number(form.totalAmount) || 0;
    const paid = Math.max(total - balance, 0);
    setForm(prev => ({
      ...prev,
      balance: balance.toString(),
      paidAmount: paid.toString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        clientId: form.clientId,
        projectName: form.projectName,
        totalAmount: Number(form.totalAmount || 0),
        paidAmount: Number(form.paidAmount || 0),
        dueDate: form.dueDate || null,
      });
      setSaving(false);
    } catch (e) {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="soft-card w-full max-w-lg mx-4 bg-white dark:bg-brand-black"
      >
        <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
            Edit Payment
          </h2>
          <button onClick={onClose} className="text-brand-grey hover:text-brand-black dark:hover:text-brand-white p-2 hover:bg-brand-grey/10 rounded-xl transition-colors">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
              Client
            </label>
            <select
              value={form.clientId}
              onChange={(e) => setForm(prev => ({ ...prev, clientId: e.target.value }))}
              required
              className="soft-input w-full"
            >
              <option value="">Select client</option>
              {(clients || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
              Project Name
            </label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => setForm(prev => ({ ...prev, projectName: e.target.value }))}
              className="soft-input w-full"
              placeholder="Project name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Total Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={form.totalAmount}
                onChange={(e) => updateTotal(e.target.value)}
                className="soft-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Paid Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={form.paidAmount}
                onChange={(e) => updatePaid(e.target.value)}
                className="soft-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Balance (₹)
              </label>
              <input
                type="number"
                min="0"
                value={form.balance}
                onChange={(e) => updateBalance(e.target.value)}
                className="soft-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                className="soft-input w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-grey/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center justify-center gap-2"
            >
              {saving && <div className="spinner w-4 h-4 border-2"></div>}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const EmailReminderModal = ({ isOpen, onClose, payment, onSend }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend(payment.id, message);
      onClose();
      setMessage('');
    } catch (error) {
      console.error('Error sending reminder:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const defaultMessage = `Dear ${payment?.clientName},\n\nThis is a friendly reminder that your payment of ₹${((payment?.totalAmount || 0) - (payment?.paidAmount || 0)).toLocaleString()} for Invoice ${payment?.invoiceNo} is due on ${payment?.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A'}.\n\nPlease arrange for the payment at your earliest convenience.\n\nThank you for your business.`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="soft-card w-full max-w-md mx-4 bg-white dark:bg-brand-black"
      >
        <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
            Send Payment Reminder
          </h2>
          <button onClick={onClose} className="text-brand-grey hover:text-brand-black dark:hover:text-brand-white p-2 hover:bg-brand-grey/10 rounded-xl transition-colors">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pt-6">
          <div className="p-4 bg-brand-grey/5 rounded-xl border border-brand-grey/10">
            <p className="text-sm text-brand-grey space-y-1">
              <div><strong className="text-brand-black dark:text-brand-white">Client:</strong> {payment?.clientName}</div>
              <div><strong className="text-brand-black dark:text-brand-white">Amount Due:</strong> ₹{((payment?.totalAmount || 0) - (payment?.paidAmount || 0)).toLocaleString()}</div>
              <div><strong className="text-brand-black dark:text-brand-white">Due Date:</strong> {payment?.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A'}</div>
            </p>
          </div>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
              Custom Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="soft-input w-full"
              placeholder={defaultMessage}
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-brand-grey/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="spinner w-4 h-4 border-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Icon icon="mdi:email-outline" className="w-4 h-4" />
                  Send Reminder
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AddPaymentModal = ({ isOpen, onClose, onCreate, clients }) => {
  const [form, setForm] = useState({ clientId: '', projectName: '', totalAmount: '', paidAmount: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const total = Math.max(Number(form.totalAmount) || 0, 0);
      const paid = Math.min(Math.max(Number(form.paidAmount) || 0, 0), total);
      await onCreate({
        clientId: form.clientId,
        invoiceNo: form.projectName.trim() || null,
        amount: total,
        paidAmount: paid,
        paymentDate: form.dueDate || null,
      });
      setSaving(false);
    } catch (e) {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="soft-card w-full max-w-lg mx-4 bg-white dark:bg-brand-black">
        <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Add Payment</h2>
          <button onClick={onClose} className="text-brand-grey hover:text-brand-black dark:hover:text-brand-white p-2 hover:bg-brand-grey/10 rounded-xl transition-colors">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Client</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm(prev => ({ ...prev, clientId: e.target.value }))}
              required
              className="soft-input w-full"
            >
              <option value="">Select client</option>
              {(clients || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Project/Invoice</label>
            <input type="text" value={form.projectName} onChange={(e) => setForm(prev => ({ ...prev, projectName: e.target.value }))} className="soft-input w-full" placeholder="Invoice or project name" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Total Amount (₹)</label>
              <input type="number" min="0" value={form.totalAmount} onChange={(e) => setForm(prev => ({ ...prev, totalAmount: e.target.value }))} className="soft-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Paid Amount (₹)</label>
              <input type="number" min="0" value={form.paidAmount} onChange={(e) => setForm(prev => ({ ...prev, paidAmount: e.target.value }))} className="soft-input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Payment/Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))} className="soft-input w-full" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-brand-grey/10">
            <button type="button" onClick={onClose} className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 soft-button bg-brand-orange text-white hover:bg-brand-yellow/60">Create</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function Payments({ userRole }) {
  const { payments, refetch, updatePayment, deletePayment, createPayment } = usePayments();
  const [reminderModal, setReminderModal] = useState({ isOpen: false, payment: null });
  const [editModal, setEditModal] = useState({ isOpen: false, payment: null });
  const [addModal, setAddModal] = useState(false);
  const [clientOptions, setClientOptions] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const exportCSV = () => {
    const headers = ['Client', 'Project', 'Total', 'Paid', 'Balance', 'Status', 'Due Date'];
    const rows = payments.map(p => [p.clientName, p.projectName, p.totalAmount, p.paidAmount, (p.totalAmount - p.paidAmount), p.status, p.due_date || '']);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendReminder = async (paymentId, message) => {
    try {
      await paymentsAPI.sendReminder(paymentId, message);
      setToast({ type: 'success', message: 'Payment reminder sent successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to send reminder. Please try again.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSavePayment = async (paymentId, patch) => {
    const result = await updatePayment(paymentId, patch);
    if (result.success) {
      setToast({ type: 'success', message: 'Payment updated successfully!' });
      setTimeout(() => setToast(null), 3000);
      setEditModal({ isOpen: false, payment: null });
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to update payment.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeletePayment = async () => {
    if (!confirmingDelete) return;
    const result = await deletePayment(confirmingDelete.id);
    if (result.success) {
      setToast({ type: 'success', message: 'Payment deleted successfully.' });
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to delete payment.' });
    }
    setTimeout(() => setToast(null), 3000);
    setConfirmingDelete(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return 'mdi:check-circle';
      case 'Partial': return 'mdi:clock-outline';
      case 'Pending': return 'mdi:alert-circle-outline';
      default: return 'mdi:currency-usd';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-700';
      case 'Pending':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  const today = new Date();
  // Calculate actual status for each payment based on balance
  const overduePayments = payments.filter(p => {
    const balance = Math.max((p.totalAmount || 0) - (p.paidAmount || 0), 0);
    return balance > 0 && p.due_date && new Date(p.due_date) < today;
  });
  const pendingPayments = payments.filter(p => {
    const balance = Math.max((p.totalAmount || 0) - (p.paidAmount || 0), 0);
    return balance > 0;
  });
  const totalRevenue = payments.reduce((sum, p) => sum + Math.min(p.paidAmount || 0, p.totalAmount || 0), 0);
  const totalPending = payments.reduce((sum, p) => sum + Math.max((p.totalAmount || 0) - (p.paidAmount || 0), 0), 0);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
        >
          <Icon icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'} className="w-5 h-5" />
          {toast.message}
        </motion.div>
      )}

      {/* Header */}
      <div className="soft-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black dark:text-brand-white">Payments</h1>
          <p className="text-brand-grey text-sm mt-1">
            Track payments and send reminders to clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(userRole === 'admin' || userRole === 'finance') && (
            <button
              onClick={async () => {
                try {
                  const res = await clientsAPI.getAll();
                  setClientOptions(res.data || []);
                } catch { setClientOptions([]); }
                setAddModal(true);
              }}
              className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center gap-2 px-4"
            >
              <Icon icon="mdi:plus" className="w-5 h-5" />
              Add Payment
            </button>
          )}
          <button
            onClick={exportCSV}
            className="soft-button bg-brand-black text-white dark:bg-brand-white dark:text-brand-black hover:opacity-90 flex items-center gap-2 px-4"
          >
            <Icon icon="mdi:download" className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
        <div className="soft-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
              <Icon icon="mdi:check-circle-outline" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-bold text-brand-black dark:text-brand-white mt-1">
                ₹{totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="soft-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl text-yellow-600 dark:text-yellow-400">
              <Icon icon="mdi:clock-outline" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider">Pending Amount</p>
              <p className="text-2xl font-bold text-brand-black dark:text-brand-white mt-1">
                ₹{totalPending.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="soft-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <Icon icon="mdi:currency-usd" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider">Pending Payments</p>
              <p className="text-2xl font-bold text-brand-black dark:text-brand-white mt-1">
                {pendingPayments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="soft-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
              <Icon icon="mdi:alert-circle-outline" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider">Overdue</p>
              <p className="text-2xl font-bold text-brand-black dark:text-brand-white mt-1">
                {overduePayments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="soft-card overflow-hidden">
        <div className="p-6 border-b border-brand-grey/10">
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">Payment Records</h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-brand-grey/5 border-b border-brand-grey/10">
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Client</th>
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Project</th>
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Total</th>
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Paid</th>
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Balance</th>
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Due Date</th>
                <th className="p-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-grey/10">
              {payments.map(p => {
                const balance = Math.max((p.totalAmount || 0) - (p.paidAmount || 0), 0);
                const actualStatus = balance <= 0 ? 'Paid' : (p.paidAmount > 0 ? 'Partial' : 'Pending');
                const overdue = actualStatus !== 'Paid' && p.due_date && new Date(p.due_date) < today;
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-brand-grey/5 transition-colors ${overdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                      }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-brand-black dark:text-brand-white">{p.clientName}</div>
                    </td>
                    <td className="p-4 text-sm text-brand-grey">{p.projectName || '-'}</td>
                    <td className="p-4 font-medium text-brand-black dark:text-brand-white">
                      {formatCurrency(p.totalAmount)}
                    </td>
                    <td className="p-4 text-green-600 dark:text-green-400 font-bold">
                      {formatCurrency(p.paidAmount)}
                    </td>
                    <td className={`p-4 font-bold ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${getStatusColor(actualStatus)}`}>
                        <Icon icon={getStatusIcon(actualStatus)} className="w-3.5 h-3.5" />
                        {actualStatus}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-brand-grey">
                      {p.due_date ? (
                        <div className={overdue ? 'text-red-600 dark:text-red-400 font-bold flex items-center gap-1' : ''}>
                          {new Date(p.due_date).toLocaleDateString()}
                          {overdue && <Icon icon="mdi:alert-circle" className="w-4 h-4" />}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {(userRole === 'admin' || userRole === 'finance') && (
                          <>
                            <button
                              onClick={() => setEditModal({ isOpen: true, payment: p })}
                              className="p-1.5 rounded-lg text-brand-grey hover:bg-brand-grey/10 hover:text-brand-black dark:hover:text-brand-white transition-colors"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmingDelete(p)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {actualStatus !== 'Paid' && balance > 0 && (userRole === 'admin' || userRole === 'finance') && (
                          <button
                            onClick={() => setReminderModal({ isOpen: true, payment: p })}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Send Reminder"
                          >
                            <Icon icon="mdi:email-outline" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-brand-grey/10">
          {payments.map((p) => {
            const balance = Math.max((p.totalAmount || 0) - (p.paidAmount || 0), 0);
            const actualStatus = balance <= 0 ? 'Paid' : (p.paidAmount > 0 ? 'Partial' : 'Pending');
            const overdue = actualStatus !== 'Paid' && p.due_date && new Date(p.due_date) < today;
            return (
              <motion.div
                key={`mobile-${p.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 space-y-3 ${overdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-brand-black dark:text-brand-white">{p.clientName}</p>
                    <p className="text-xs text-brand-grey">{p.projectName || '—'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusColor(actualStatus)}`}>
                    <Icon icon={getStatusIcon(actualStatus)} className="w-3.5 h-3.5" />
                    {actualStatus}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-grey">Total</dt>
                    <dd className="mt-1 font-medium text-brand-black dark:text-brand-white">{formatCurrency(p.totalAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-grey">Paid</dt>
                    <dd className="mt-1 font-medium text-green-600 dark:text-green-400">{formatCurrency(p.paidAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-grey">Balance</dt>
                    <dd className={`mt-1 font-medium ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(balance)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-grey">Due</dt>
                    <dd className={`mt-1 font-medium ${overdue ? 'text-red-600 dark:text-red-400' : 'text-brand-black dark:text-brand-white'}`}>
                      {p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-grey/10 mt-2">
                  {(userRole === 'admin' || userRole === 'finance') && (
                    <>
                      <button
                        onClick={() => setEditModal({ isOpen: true, payment: p })}
                        className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 py-2 text-xs flex items-center justify-center gap-1"
                      >
                        <Icon icon="mdi:pencil-outline" className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(p)}
                        className="flex-1 soft-button bg-red-50 text-red-600 hover:bg-red-100 py-2 text-xs flex items-center justify-center gap-1"
                      >
                        <Icon icon="mdi:trash-can-outline" className="h-4 w-4" /> Delete
                      </button>
                    </>
                  )}
                  {actualStatus !== 'Paid' && balance > 0 && (userRole === 'admin' || userRole === 'finance') && (
                    <button
                      onClick={() => setReminderModal({ isOpen: true, payment: p })}
                      className="flex-1 soft-button bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 text-xs flex items-center justify-center gap-1"
                    >
                      <Icon icon="mdi:email-outline" className="h-4 w-4" /> Remind
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="soft-card w-full max-w-sm p-6 bg-white dark:bg-[#121212]">
            <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">Delete Payment</h3>
            <p className="mt-2 text-sm text-brand-grey">
              Are you sure you want to delete the payment for <span className="font-bold text-brand-black dark:text-brand-white">{confirmingDelete.clientName}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmingDelete(null)}
                className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                className="flex-1 soft-button bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, payment: null })}
        payment={editModal.payment}
        onSave={handleSavePayment}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        clients={clientOptions}
        onCreate={async (payload) => {
          const result = await createPayment(payload);
          if (result.success) {
            setToast({ type: 'success', message: 'Payment added successfully!' });
            setTimeout(() => setToast(null), 3000);
            setAddModal(false);
          } else {
            setToast({ type: 'error', message: result.error || 'Failed to add payment.' });
            setTimeout(() => setToast(null), 3000);
          }
        }}
      />

      {/* Reminder Modal */}
      <EmailReminderModal
        isOpen={reminderModal.isOpen}
        onClose={() => setReminderModal({ isOpen: false, payment: null })}
        payment={reminderModal.payment}
        onSend={handleSendReminder}
      />
    </div>
  );
}
