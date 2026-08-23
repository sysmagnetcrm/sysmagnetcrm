import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const ClientCard = ({ client, onSelect, onCreateTask, onDelete, userRole }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-yellow-100 text-yellow-700';
      case 'Qualified': return 'bg-green-100 text-green-700';
      case 'Proposal': return 'bg-purple-100 text-purple-700';
      case 'Closed': return 'bg-brand-black text-white';
      default: return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="soft-card p-5 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-black dark:text-brand-white truncate mb-0.5">
            {client.name}
          </h3>
          <div className="text-xs font-medium text-brand-grey truncate">
            {client.contact}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${getStatusColor(client.status)}`}>
          {client.status}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-brand-grey">
          <Icon icon="mdi:phone-outline" className="w-3.5 h-3.5" />
          <span className="truncate">{client.phone}</span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-xs text-brand-grey">
            <Icon icon="mdi:email-outline" className="w-3.5 h-3.5" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-brand-grey/10">
        <button
          onClick={() => onSelect(client)}
          className="flex-1 py-1.5 rounded-lg bg-brand-grey/5 text-xs font-bold text-brand-grey hover:bg-brand-grey/10 hover:text-brand-black dark:hover:text-brand-white transition-colors flex items-center justify-center gap-1"
        >
          <Icon icon="mdi:eye-outline" className="w-3.5 h-3.5" />
          View
        </button>
        <button
          onClick={() => onCreateTask(client)}
          className="flex-1 py-1.5 rounded-lg bg-brand-orange/10 text-xs font-bold text-brand-orange hover:bg-brand-yellow/60/20 transition-colors flex items-center justify-center gap-1"
        >
          <Icon icon="mdi:checkbox-marked-circle-plus-outline" className="w-3.5 h-3.5" />
          Task
        </button>
        {onDelete && userRole === 'admin' && (
          <button
            onClick={() => {
              if (window.confirm('Delete this client?')) onDelete(client.id);
            }}
            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            title="Delete"
          >
            <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const AddClientModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    status: 'New',
    source: 'Manual',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', contact: '', phone: '', email: '', status: 'New', source: 'Manual', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="soft-card w-full max-w-md p-6 bg-white dark:bg-brand-black"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Add New Client</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="soft-input w-full"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Contact Person *</label>
            <input
              type="text"
              required
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="soft-input w-full"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="soft-input w-full"
                placeholder="+1..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="soft-input w-full"
                placeholder="john@acme.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="soft-input w-full"
              >
                {['New', 'Contacted', 'Qualified', 'Proposal', 'Closed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="soft-input w-full"
              >
                {['Manual', 'Website', 'Referral', 'Social Media', 'Cold Call'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 soft-button bg-brand-orange text-white hover:bg-brand-yellow/60"
            >
              Add Client
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Clients = ({ clients, onSelect, onAdd, onCreateTask, searchQuery, userRole, onDelete }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const list = Array.isArray(clients) ? clients : [];
  const q = String(searchQuery || '').toLowerCase();
  const filteredClients = list.filter(client => {
    const name = String(client?.name || '').toLowerCase();
    const contact = String(client?.contact || '').toLowerCase();
    const status = String(client?.status || '');
    const matchesSearch = name.includes(q) || contact.includes(q);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const products = useMemo(() => {
    const set = new Set();
    let hasGeneral = false;
    list.forEach(c => {
      const p = String(c?.product || c?.service || c?.serviceType || '').trim();
      if (p) set.add(p);
      else hasGeneral = true;
    });
    const arr = Array.from(set);
    return hasGeneral ? [...arr, 'General'] : arr;
  }, [clients]);

  const groups = useMemo(() => {
    const order = (products.length ? products : ['General']);
    const map = order.reduce((acc, k) => { acc[k] = []; return acc; }, {});
    filteredClients.forEach(c => {
      const key = String(c?.product || c?.service || c?.serviceType || 'General');
      (map[key] || (map[key] = [])).push(c);
    });
    return { order, map };
  }, [filteredClients, products]);

  const dotColors = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-purple-500', 'bg-amber-500'];
  const colorFor = (idx) => dotColors[idx % dotColors.length];

  const handleAddClient = async (clientData) => {
    try {
      await onAdd(clientData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Clients</h1>
          <p className="text-brand-grey mt-1">
            Manage your client relationships and track progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const headers = ['Company', 'Contact', 'Phone', 'Email', 'Status', 'Source', 'Product'];
              const rows = filteredClients.map(c => [c.name, c.contact, c.phone, c.email || '', c.status, c.source || '', c.product || c.service || '']);
              const csv = [headers, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'clients.csv'; a.click(); URL.revokeObjectURL(url);
            }}
            className="soft-button bg-brand-white dark:bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/10 flex items-center gap-2"
          >
            <Icon icon="mdi:download" className="w-5 h-5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {(userRole === 'admin' || userRole === 'sales') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center gap-2"
            >
              <Icon icon="mdi:plus" className="w-5 h-5" />
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10">
          <Icon icon="mdi:filter-variant" className="w-5 h-5 text-brand-grey" />
          <span className="text-sm font-bold text-brand-black dark:text-brand-white whitespace-nowrap">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Clients Grouped Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-20 soft-card">
          <div className="w-20 h-20 mx-auto bg-brand-grey/5 rounded-full flex items-center justify-center text-brand-grey mb-4">
            <Icon icon="mdi:account-search-outline" className="w-10 h-10" />
          </div>
          <div className="text-lg font-bold text-brand-black dark:text-brand-white mb-1">No clients found</div>
          <div className="text-brand-grey">
            {searchQuery ? 'Try adjusting your search terms' : 'Add your first client to get started'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {groups.order.map((cat, i) => (
            <div key={cat} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${colorFor(i)} shadow-sm`}></span>
                  <h3 className="font-bold text-brand-black dark:text-brand-white">{cat}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-brand-grey/10 text-brand-grey">
                  {groups.map[cat]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {(groups.map[cat] || []).map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onSelect={onSelect}
                    onCreateTask={onCreateTask}
                    onDelete={onDelete}
                    userRole={userRole}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddClient}
      />
    </div>
  );
};

export default Clients;
