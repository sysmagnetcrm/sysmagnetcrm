import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { activitiesAPI, leadsAPI } from '../utils/supabaseServices';

const LeadCard = ({ lead, onSelect, onCall, onMail, onQualify, onConvert, onDelete, onEdit, userRole, salesUsers = [], onAssignTo }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Contacted': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Qualified': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Unqualified': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect && onSelect(lead)}
      className="group relative bg-white dark:bg-brand-black rounded-3xl border border-brand-grey/10 p-5 hover:border-brand-orange/30 hover:shadow-xl hover:shadow-brand-orange/5 transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xl shadow-inner shrink-0">
            {String(lead.contact || lead.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-brand-black dark:text-brand-white truncate text-base leading-tight mb-1" title={lead.name}>
              {lead.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
              {lead.source && (
                <span className="text-[10px] font-medium text-brand-grey bg-brand-grey/5 px-2 py-0.5 rounded-md border border-brand-grey/10 truncate max-w-[80px]">
                  {lead.source}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
            className="p-2 rounded-xl text-brand-grey hover:bg-brand-orange/10 hover:text-brand-orange transition-colors"
          >
            <Icon icon="mdi:pencil" className="w-5 h-5" />
          </button>
          {onDelete && (userRole === 'admin' || userRole === 'digital_marketer') && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
              className="p-2 rounded-xl text-brand-grey hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Icon icon="mdi:trash-can" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2.5 mb-5 bg-brand-grey/5 rounded-2xl p-3 border border-brand-grey/5">
        <div className="flex items-center gap-2.5 text-xs font-medium text-brand-black dark:text-brand-white">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-brand-black flex items-center justify-center text-brand-grey shadow-sm shrink-0">
            <Icon icon="mdi:account" className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">{lead.contact}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-brand-grey">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-brand-black flex items-center justify-center text-brand-grey shadow-sm shrink-0">
            <Icon icon="mdi:phone" className="w-3.5 h-3.5" />
          </div>
          <span className="truncate font-mono">{lead.phone}</span>
        </div>
        {lead.email && (
          <div className="flex items-center gap-2.5 text-xs text-brand-grey">
            <div className="w-6 h-6 rounded-lg bg-white dark:bg-brand-black flex items-center justify-center text-brand-grey shadow-sm shrink-0">
              <Icon icon="mdi:email" className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={(e) => { e.stopPropagation(); onCall(lead); }}
          className="flex items-center justify-center p-2.5 rounded-xl bg-brand-grey/5 hover:bg-green-50 hover:text-green-600 hover:border-green-100 border border-transparent transition-all group/btn"
          title="Call"
        >
          <Icon icon="mdi:phone" className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMail(lead); }}
          className="flex items-center justify-center p-2.5 rounded-xl bg-brand-grey/5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 border border-transparent transition-all group/btn"
          title="Email"
        >
          <Icon icon="mdi:email" className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
        </button>

        {(lead.status === 'New' || lead.status === 'Contacted') && (
          <button className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-brand-black text-white hover:bg-brand-orange hover:shadow-lg hover:shadow-brand-orange/20 transition-all text-xs font-bold active:scale-95">
            <Icon icon="mdi:clock-outline" className="w-4 h-4" />
            <span>Follow Up</span>
          </button>
        )}

        {lead.status === 'Contacted' && (
          <button onClick={(e) => { e.stopPropagation(); onQualify(lead.id); }} className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all text-xs font-bold active:scale-95">
            <Icon icon="mdi:check-circle" className="w-4 h-4" />
            <span>Qualify</span>
          </button>
        )}

        {(lead.status === 'Qualified' || (String(userRole || '').toLowerCase() === 'sales' && (lead.status === 'New' || lead.status === 'Contacted'))) && (
          <button onClick={(e) => { e.stopPropagation(); onConvert(lead); }} className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-brand-orange text-black hover:bg-brand-yellow/60 hover:shadow-lg hover:shadow-brand-orange/20 transition-all text-xs font-bold active:scale-95">
            <Icon icon="mdi:account-convert" className="w-4 h-4" />
            <span>Convert</span>
          </button>
        )}

        {lead.status === 'Unqualified' && (
          <span className="col-span-2 flex items-center justify-center p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold">
            RNR
          </span>
        )}
      </div>

      {/* Footer: Assigned To */}
      <div className="pt-3 border-t border-brand-grey/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-brand-grey uppercase tracking-wider">Assigned Agent</span>
          {userRole === 'admin' ? (
            <div className="relative group/assign flex items-center gap-2">
              <select
                value={lead.assigned_to || ''}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onAssignTo && onAssignTo(lead.id, e.target.value ? Number(e.target.value) : null)}
                className="appearance-none pl-2 pr-6 py-1 text-xs font-bold bg-transparent hover:bg-brand-grey/5 rounded-lg cursor-pointer focus:ring-0 border-none text-right w-32 truncate"
              >
                <option value="">Unassigned</option>
                {salesUsers.length === 0 ? (
                  <option value="" disabled>No agents available</option>
                ) : (
                  salesUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))
                )}
              </select>
              <Icon icon="mdi:chevron-down" className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-grey pointer-events-none" />
              <span className="text-[10px] text-brand-grey">{lead.assigned_to_name || 'Unassigned'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-brand-black text-white flex items-center justify-center text-[10px] font-bold">
                {(lead.assigned_to_name || 'U').charAt(0)}
              </div>
              <span className="text-xs font-bold text-brand-black dark:text-brand-white truncate max-w-[140px]" title={lead.assigned_to_name || 'Unassigned'}>
                {lead.assigned_to_name || 'Unassigned'}
              </span>
            </div>
          )}
        </div>
        {userRole === 'admin' && salesUsers.length === 0 && (
          <div className="mt-1 text-[10px] text-brand-grey">
            Add employees with Sales role to assign leads.
          </div>
        )}
      </div>
      {/* Meta: Created/Updated */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-brand-grey">
        <span>Created by {lead.created_by_name || '—'}</span>
        <span>Last updated by {lead.updated_by_name || '—'}</span>
      </div>
    </motion.div>
  );
};

const ConvertLeadModal = ({ isOpen, onClose, onSubmit, lead }) => {
  const [formData, setFormData] = useState({
    totalAmount: '',
    advanceAmount: '0',
    phasesCount: '1',
    billingType: 'One-time',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      totalAmount: Number(formData.totalAmount || 0),
      advanceAmount: Number(formData.advanceAmount || 0),
      phasesCount: Number(formData.phasesCount || 1),
      billingType: formData.billingType,
    };
    await onSubmit(lead.id, payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="soft-card w-full max-w-md p-6 bg-white dark:bg-brand-black rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Convert to Client</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Total Amount *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              className="soft-input w-full rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Advance Paid</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.advanceAmount}
              onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
              className="soft-input w-full rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">No. of Phases</label>
              <input
                type="number"
                min="1"
                value={formData.phasesCount}
                onChange={(e) => setFormData({ ...formData, phasesCount: e.target.value })}
                className="soft-input w-full rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Billing Type</label>
              <select
                value={formData.billingType}
                onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                className="soft-input w-full rounded-xl"
              >
                <option value="One-time">One-time</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 rounded-xl"
            >
              Convert
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const EditLeadModal = ({ isOpen, onClose, lead, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: lead?.name || '',
    contact: lead?.contact || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    status: lead?.status || 'New',
    source: lead?.source || 'Manual',
    service: lead?.service || '',
    notes: lead?.notes || ''
  });

  useEffect(() => {
    if (lead && isOpen) {
      setFormData({
        name: lead.name || '',
        contact: lead.contact || '',
        phone: lead.phone || '',
        email: lead.email || '',
        status: lead.status || 'New',
        source: lead.source || 'Manual',
        service: lead.service || '',
        notes: lead.notes || ''
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(lead.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="soft-card w-full max-w-2xl bg-white dark:bg-brand-black flex flex-col max-h-[85vh] shadow-2xl overflow-hidden rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-grey/10 bg-white dark:bg-brand-black z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Edit Lead</h2>
            <p className="text-xs text-brand-grey mt-1">Update lead information and status</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey transition-colors"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="edit-lead-form" onSubmit={handleSubmit} className="space-y-6">

            {/* Section: Company & Contact */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider flex items-center gap-2">
                <Icon icon="mdi:domain" className="w-4 h-4" />
                Company & Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-brand-grey/10 my-2"></div>

            {/* Section: Lead Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider flex items-center gap-2">
                <Icon icon="mdi:clipboard-text-outline" className="w-4 h-4" />
                Lead Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Current Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="soft-input w-full rounded-xl"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Unqualified">Unqualified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="soft-input w-full rounded-xl"
                  >
                    <option value="Manual">Manual Entry</option>
                    <option value="Website">Website Form</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Google Ads">Google Ads</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Interested Service</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="soft-input w-full rounded-xl"
                  >
                    <option value="">Select a service...</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="ERP">ERP Implementation</option>
                    <option value="Website">Website Development</option>
                    <option value="App">Mobile App Development</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Notes & Comments</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="soft-input w-full resize-none rounded-xl"
                    placeholder="Add any additional details about this lead..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-grey/10 bg-brand-grey/5 flex gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-brand-grey hover:bg-brand-grey/10 hover:text-brand-black dark:hover:text-brand-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-lead-form"
            className="flex-1 py-3 rounded-xl font-bold bg-brand-orange text-black hover:bg-brand-yellow/60 shadow-lg shadow-brand-orange/20 transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AddLeadModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    status: 'New',
    source: 'Manual',
    service: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', contact: '', phone: '', email: '', status: 'New', source: 'Manual', service: '', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="soft-card w-full max-w-2xl bg-white dark:bg-brand-black flex flex-col max-h-[85vh] shadow-2xl overflow-hidden rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-grey/10 bg-white dark:bg-brand-black z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Add New Lead</h2>
            <p className="text-xs text-brand-grey mt-1">Enter lead details to track conversion</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey transition-colors"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-6">

            {/* Section: Company & Contact */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider flex items-center gap-2">
                <Icon icon="mdi:domain" className="w-4 h-4" />
                Company & Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="soft-input w-full rounded-xl"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-brand-grey/10 my-2"></div>

            {/* Section: Lead Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider flex items-center gap-2">
                <Icon icon="mdi:clipboard-text-outline" className="w-4 h-4" />
                Lead Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="soft-input w-full rounded-xl"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Unqualified">Unqualified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="soft-input w-full rounded-xl"
                  >
                    <option value="Manual">Manual Entry</option>
                    <option value="Website">Website Form</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Google Ads">Google Ads</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Interested Service</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="soft-input w-full rounded-xl"
                  >
                    <option value="">Select a service...</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="ERP">ERP Implementation</option>
                    <option value="Website">Website Development</option>
                    <option value="App">Mobile App Development</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Notes & Comments</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="soft-input w-full resize-none rounded-xl"
                    placeholder="Add any initial notes..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-grey/10 bg-brand-grey/5 flex gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-brand-grey hover:bg-brand-grey/10 hover:text-brand-black dark:hover:text-brand-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-lead-form"
            className="flex-1 py-3 rounded-xl font-bold bg-brand-orange text-black hover:bg-brand-yellow/60 shadow-lg shadow-brand-orange/20 transition-all active:scale-95"
          >
            Create Lead
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const BulkImportModal = ({ isOpen, onClose, onSubmit }) => {
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const leads = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const lead = {};
        headers.forEach((header, index) => {
          lead[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
        });
        return {
          name: lead.company_name || lead.name || '',
          contact: lead.contact_person || lead.contact || '',
          phone: lead.phone || '',
          email: lead.email || '',
          status: 'New',
          source: lead.source || 'Bulk Import',
          service: lead.service || '',
          notes: lead.notes || ''
        };
      });
      await onSubmit(leads);
      setCsvData('');
      onClose();
    } catch (error) {
      console.error('Error processing CSV:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="soft-card w-full max-w-2xl p-6 bg-white dark:bg-[#121212] rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Bulk Import Leads</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2 text-sm">CSV Format:</h3>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
            Company Name, Contact Person, Phone, Email, Source, Service, Notes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">CSV Data *</label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={10}
              className="soft-input w-full font-mono text-xs rounded-xl"
              placeholder="Paste your CSV data here..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 disabled:opacity-50 rounded-xl"
            >
              {isProcessing ? 'Processing...' : 'Import Leads'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Leads = ({ leads, onSelect, onAdd, onBulkImport, onCall, onMail, onQualify, onConvert, onDelete, onUpdate, searchQuery, userRole, salesUsers = [], onAssignTo, filters = {}, onChangeFilters, userOptions = [], onRefreshAgents }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');

  const products = useMemo(() => {
    const set = new Set();
    (Array.isArray(leads) ? leads : []).forEach(l => {
      const p = String(l?.product || l?.service || '').trim();
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [leads]);

  const list = Array.isArray(leads) ? leads : [];
  const q = String(searchQuery || '').toLowerCase();
  const filterSourceLower = String(filterSource || 'all').toLowerCase();
  const filterProductLower = String(filterProduct || 'all').toLowerCase();
  const filteredLeads = list.filter(lead => {
    const name = String(lead?.name || '').toLowerCase();
    const contact = String(lead?.contact || '').toLowerCase();
    const status = String(lead?.status || '');
    const source = String(lead?.source || '').toLowerCase();
    const product = String(lead?.product || lead?.service || '').toLowerCase();
    const matchesSearch = name.includes(q) || contact.includes(q);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesSource = filterSourceLower === 'all' || source === filterSourceLower;
    const matchesProduct = filterProductLower === 'all' || product === filterProductLower;
    return matchesSearch && matchesStatus && matchesSource && matchesProduct;
  });

  const groups = useMemo(() => {
    const order = ['New', 'Contacted', 'Qualified', 'Unqualified'];
    const colors = {
      New: 'text-blue-600 bg-blue-50 border-blue-100',
      Contacted: 'text-amber-600 bg-amber-50 border-amber-100',
      Qualified: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      Unqualified: 'text-rose-600 bg-rose-50 border-rose-100'
    };
    const icons = {
      New: 'mdi:star-circle',
      Contacted: 'mdi:phone-in-talk',
      Qualified: 'mdi:check-decagram',
      Unqualified: 'mdi:close-circle'
    };
    const map = order.reduce((acc, k) => { acc[k] = []; return acc; }, {});
    filteredLeads.forEach(l => { (map[l.status] || (map[l.status] = [])).push(l); });
    return { order, colors, icons, map };
  }, [filteredLeads]);

  const handleAddLead = async (leadData) => {
    try {
      await onAdd(leadData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleBulkImport = async (leadsData) => {
    try {
      await onBulkImport(leadsData);
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error importing leads:', error);
    }
  };

  const handleCall = (lead) => {
    try { leadsAPI.contact(lead.id, { method: 'call' }); } catch { }
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleMail = (lead) => {
    if (lead.email) {
      try { leadsAPI.contact(lead.id, { method: 'mail' }); } catch { }
      window.open(`mailto:${lead.email}`, '_self');
    }
  };

  const exportCSV = () => {
    const headers = ['Company', 'Contact', 'Phone', 'Email', 'Status', 'Source'];
    const rows = filteredLeads.map(l => [l.name, l.contact, l.phone, l.email || '', l.status, l.source || '']);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Leads</h1>
          <p className="text-brand-grey mt-1">
            Manage your sales leads and track conversion
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Admin Filters: Assigned To / Created By / Updated By */}
          {userRole === 'admin' && (
            <>
              <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/10 rounded-xl px-2 py-1 border border-brand-grey/10">
                <span className="text-[10px] font-bold text-brand-grey uppercase">Assigned To</span>
                <select
                  value={filters.assigned_to ?? ''}
                  onChange={(e) => onChangeFilters && onChangeFilters({ ...filters, assigned_to: e.target.value ? Number(e.target.value) : undefined })}
                  className="text-xs bg-transparent focus:ring-0 border-none"
                >
                  <option value="">All</option>
                  {salesUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={async () => { try { await onRefreshAgents?.(); } catch { } }}
                  className="ml-1 p-1 rounded-lg hover:bg-brand-grey/10 text-brand-grey"
                  title="Refresh agents"
                >
                  <Icon icon="mdi:refresh" className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/10 rounded-xl px-2 py-1 border border-brand-grey/10">
                <span className="text-[10px] font-bold text-brand-grey uppercase">Created By</span>
                <select
                  value={filters.created_by ?? ''}
                  onChange={(e) => onChangeFilters && onChangeFilters({ ...filters, created_by: e.target.value || undefined })}
                  className="text-xs bg-transparent focus:ring-0 border-none"
                >
                  <option value="">All</option>
                  {userOptions.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-brand-grey/10 rounded-xl px-2 py-1 border border-brand-grey/10">
                <span className="text-[10px] font-bold text-brand-grey uppercase">Updated By</span>
                <select
                  value={filters.updated_by ?? ''}
                  onChange={(e) => onChangeFilters && onChangeFilters({ ...filters, updated_by: e.target.value || undefined })}
                  className="text-xs bg-transparent focus:ring-0 border-none"
                >
                  <option value="">All</option>
                  {userOptions.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {userRole === 'admin' && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="soft-button bg-white dark:bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/10 flex items-center gap-2 shadow-sm"
            >
              <Icon icon="mdi:upload" className="w-5 h-5" />
              <span>Import</span>
            </button>
          )}
          {userRole === 'admin' && (filters.assigned_to || filters.created_by || filters.updated_by) && (
            <button
              onClick={() => onChangeFilters && onChangeFilters({ ...(filters || {}), assigned_to: undefined, created_by: undefined, updated_by: undefined })}
              className="soft-button bg-white dark:bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/10 flex items-center gap-2 shadow-sm"
              title="Clear user filters"
            >
              <Icon icon="mdi:filter-remove" className="w-5 h-5" />
              <span>Clear Filters</span>
            </button>
          )}
          <button
            onClick={exportCSV}
            className="soft-button bg-white dark:bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/10 flex items-center gap-2 shadow-sm"
          >
            <Icon icon="mdi:download" className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="soft-button bg-brand-orange text-black hover:bg-brand-yellow/60 flex items-center gap-2 shadow-lg shadow-brand-orange/20 active:scale-95 transition-all"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            <span>Add Leads</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {groups.order.map(status => (
          <div key={status} className={`p-5 rounded-3xl border ${groups.colors[status]} bg-opacity-40 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">{status}</span>
              <Icon icon={groups.icons[status]} className="w-6 h-6 opacity-70" />
            </div>
            <div className="text-3xl font-bold">
              {groups.map[status].length}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10 shadow-sm hover:border-brand-orange/30 transition-colors">
          <Icon icon="mdi:filter-variant" className="w-5 h-5 text-brand-grey" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer p-0 pr-6"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
          </select>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10 shadow-sm hover:border-brand-orange/30 transition-colors">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer p-0 pr-6"
          >
            <option value="all">All Sources</option>
            <option value="Manual">Manual</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="Cold Call">Cold Call</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Bulk Import">Bulk Import</option>
          </select>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10 shadow-sm hover:border-brand-orange/30 transition-colors">
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer"
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p} value={p.toLowerCase()}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Columns */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-20 soft-card">
          <div className="w-20 h-20 mx-auto bg-brand-grey/5 rounded-full flex items-center justify-center text-brand-grey mb-4">
            <Icon icon="mdi:account-search-outline" className="w-10 h-10" />
          </div>
          <div className="text-lg font-bold text-brand-black dark:text-brand-white mb-1">No leads found</div>
          <div className="text-brand-grey">
            {searchQuery ? 'Try adjusting your search terms' : 'Add your first lead to get started'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {groups.order.map((status) => (
            <div key={status} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${status === 'New' ? 'bg-blue-500' :
                    status === 'Contacted' ? 'bg-amber-500' :
                      status === 'Qualified' ? 'bg-emerald-500' :
                        'bg-rose-500'
                    } shadow-sm`}></span>
                  <h3 className="font-bold text-brand-black dark:text-brand-white">{{ New: 'New', Contacted: 'Follow up', Qualified: 'In Progress', Unqualified: 'RNR' }[status] || status}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-brand-grey/10 text-brand-grey">
                  {groups.map[status]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {(groups.map[status] || []).map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onSelect={(l) => { setViewLead(l); if (onSelect) onSelect(l); }}
                    onCall={handleCall}
                    onMail={handleMail}
                    onQualify={onQualify}
                    onConvert={(l) => setConvertLead(l)}
                    onDelete={(id) => setLeadToDelete(id)}
                    onEdit={(l) => setEditLead(l)}
                    userRole={userRole}
                    salesUsers={salesUsers}
                    onAssignTo={onAssignTo}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Lead Modal */}
      {viewLead && (
        <ViewLeadModal lead={viewLead} onClose={() => setViewLead(null)} />
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddLead}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={handleBulkImport}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={!!editLead}
        onClose={() => setEditLead(null)}
        lead={editLead}
        onSubmit={onUpdate}
      />

      <ConvertLeadModal
        isOpen={!!convertLead}
        onClose={() => setConvertLead(null)}
        lead={convertLead}
        onSubmit={onConvert}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={() => { onDelete(leadToDelete); setLeadToDelete(null); }}
      />
    </div>
  );
};

export default Leads;

const ViewLeadModal = ({ lead, onClose }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const res = await activitiesAPI.list({ type: 'lead', lead_id: lead.id, limit: 100 });
        const items = (res.data || []).map(r => ({
          id: r.id,
          text: r.content || '',
          at: new Date(r.created_at).toLocaleString(),
          meta: (() => { try { return JSON.parse(r.metadata || '{}'); } catch { return {}; } })()
        }));
        setTimeline(items);
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
        setTimeline([]);
      } finally { setLoading(false); }
    };
    if (lead?.id) load();
  }, [lead?.id]);

  const stages = ['New', 'Contacted', 'Qualified'];
  const firstByStage = () => {
    const map = new Map();
    (timeline || []).forEach(it => {
      const t = (it.meta?.stage || '') || (it.text.toLowerCase().includes('qualified') ? 'Qualified' : it.text.toLowerCase().includes('contact') ? 'Contacted' : it.text.toLowerCase().includes('created') ? 'New' : '');
      if (t && !map.has(t)) map.set(t, it.at);
    });
    return stages.map(s => ({ stage: s, at: map.get(s) || '—' }));
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="soft-card w-full max-w-4xl bg-white dark:bg-brand-black flex flex-col max-h-[90vh] shadow-2xl overflow-hidden rounded-3xl"
      >
        {/* Header - Fixed */}
        <div className="flex items-start justify-between p-6 border-b border-brand-grey/10 bg-white dark:bg-brand-black z-10 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange text-2xl font-bold shrink-0 shadow-inner">
              {String(lead.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-brand-grey uppercase tracking-wider">Lead Details</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${lead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    lead.status === 'Qualified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                  {lead.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white truncate leading-tight">{lead.name}</h2>
              <div className="text-sm text-brand-grey truncate font-medium">{lead.contact}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-brand-grey/10 text-brand-grey hover:text-brand-black transition-colors shrink-0"
          >
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-brand-grey/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Info (7 cols) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Contact Info Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-black border border-brand-grey/10 shadow-sm">
                <div className="flex items-center gap-2 mb-5 text-sm font-bold text-brand-black dark:text-brand-white">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Icon icon="mdi:card-account-details-outline" className="w-5 h-5" />
                  </div>
                  Contact Information
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-brand-grey/5 flex items-center justify-center text-brand-grey group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors">
                      <Icon icon="mdi:phone" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-0.5">Phone</div>
                      <div className="text-brand-black dark:text-brand-white font-medium font-mono text-sm">{lead.phone || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-brand-grey/5 flex items-center justify-center text-brand-grey group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors">
                      <Icon icon="mdi:email" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-0.5">Email</div>
                      <div className="text-brand-black dark:text-brand-white font-medium text-sm break-all">{lead.email || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Details Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-black border border-brand-grey/10 shadow-sm">
                <div className="flex items-center gap-2 mb-5 text-sm font-bold text-brand-black dark:text-brand-white">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Icon icon="mdi:clipboard-list-outline" className="w-5 h-5" />
                  </div>
                  Lead Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5">Source</div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:bullhorn" className="w-4 h-4 text-brand-grey" />
                      <span className="text-brand-black dark:text-brand-white font-medium text-sm">{lead.source || 'Manual'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5">Interested Service</div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:briefcase" className="w-4 h-4 text-brand-grey" />
                      <span className="text-brand-black dark:text-brand-white font-medium text-sm">{lead.service || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5">Assigned To</div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:account-tie" className="w-4 h-4 text-brand-grey" />
                      <span className="text-brand-black dark:text-brand-white font-medium text-sm">{lead.assigned_to_name || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5">Created By</div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:account-badge" className="w-4 h-4 text-brand-grey" />
                      <span className="text-brand-black dark:text-brand-white font-medium text-sm">{lead.created_by_name || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5">Last Updated By</div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:account-clock" className="w-4 h-4 text-brand-grey" />
                      <span className="text-brand-black dark:text-brand-white font-medium text-sm">{lead.updated_by_name || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5">Updated At</div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:calendar-clock" className="w-4 h-4 text-brand-grey" />
                      <span className="text-brand-black dark:text-brand-white font-medium text-sm">{lead.updated_at ? new Date(lead.updated_at).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              {lead.notes && (
                <div className="p-6 rounded-3xl bg-white dark:bg-brand-black border border-brand-grey/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-sm font-bold text-brand-black dark:text-brand-white">
                    <div className="p-2 rounded-xl bg-yellow-50 text-yellow-600">
                      <Icon icon="mdi:text-long" className="w-5 h-5" />
                    </div>
                    Notes & Comments
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-brand-black dark:text-brand-white bg-brand-grey/5 p-4 rounded-xl border border-brand-grey/5">
                    {lead.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Timeline & Stages (5 cols) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Stages Summary */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-black border border-brand-grey/10 shadow-sm">
                <div className="flex items-center gap-2 mb-5 text-sm font-bold text-brand-black dark:text-brand-white">
                  <div className="p-2 rounded-xl bg-green-50 text-green-600">
                    <Icon icon="mdi:flag-checkered" className="w-5 h-5" />
                  </div>
                  Progress
                </div>
                <div className="space-y-4 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-brand-grey/10"></div>

                  {firstByStage().map((s, i) => (
                    <div key={s.stage} className="relative flex items-center justify-between text-sm z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full border-4 border-white dark:border-brand-black flex items-center justify-center shadow-sm transition-colors ${s.at !== '—' ? 'bg-green-500 text-white' : 'bg-brand-grey/10 text-brand-grey'
                          }`}>
                          <Icon icon={s.at !== '—' ? "mdi:check" : "mdi:circle-outline"} className="w-5 h-5" />
                        </div>
                        <span className={`font-bold ${s.at !== '—' ? 'text-brand-black dark:text-brand-white' : 'text-brand-grey'}`}>
                          {s.stage}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-brand-grey bg-brand-grey/5 px-2 py-1 rounded-md">
                        {s.at !== '—' ? s.at.split(',')[0] : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-black border border-brand-grey/10 shadow-sm flex flex-col h-[400px]">
                <div className="flex items-center gap-2 mb-5 text-sm font-bold text-brand-black dark:text-brand-white shrink-0">
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                    <Icon icon="mdi:history" className="w-5 h-5" />
                  </div>
                  Activity History
                </div>

                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="spinner"></div>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-red-500 text-center px-4">
                    {error}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    {(timeline || []).map((it, idx) => (
                      <div key={it.id} className="relative pl-6 border-l-2 border-brand-grey/10 pb-1 last:pb-0 last:border-l-0">
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-orange border-2 border-white dark:border-brand-black shadow-sm"></div>
                        <div className="text-[10px] font-bold text-brand-grey uppercase tracking-wider mb-1">{it.at}</div>
                        <div className="text-sm text-brand-black dark:text-brand-white leading-snug">{it.text}</div>
                      </div>
                    ))}
                    {timeline.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-brand-grey opacity-60">
                        <Icon icon="mdi:clock-outline" className="w-12 h-12 mb-2" />
                        <span className="text-sm">No activity recorded yet</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="soft-card w-full max-w-sm p-6 bg-white dark:bg-brand-black rounded-3xl shadow-2xl text-center"
      >
        <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Icon icon="mdi:alert-circle-outline" className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-brand-black dark:text-brand-white mb-2">Delete Lead?</h3>
        <p className="text-sm text-brand-grey mb-6">
          Are you sure you want to delete this lead? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-brand-grey hover:bg-brand-grey/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};
