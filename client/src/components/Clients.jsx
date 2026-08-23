import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';

const ClientCard = ({ client, onSelect, onCreateTask, onDelete, userRole }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'New': return 'badge-info';
      case 'Pending': return 'badge-warning';
      case 'Inactive': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="saas-card p-5 saas-card-hover flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-base mb-0.5" title={client.name}>
              {client.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">{client.contact || client.email || 'No contact person'}</p>
          </div>
          <span className={`badge ${getStatusBadge(client.status)}`}>
            {client.status || 'Active'}
          </span>
        </div>

        <div className="space-y-1.5 mb-4 py-2 border-y border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:phone" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{client.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:envelope" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{client.email || 'N/A'}</span>
          </div>
          {client.service_type && (
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:briefcase" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{client.service_type}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => onSelect(client)}
          className="btn-secondary flex-1 text-xs py-1.5"
        >
          <Icon icon="heroicons:eye" className="w-3.5 h-3.5 mr-1" />
          Details
        </button>
        <button
          onClick={() => onCreateTask(client)}
          className="btn-secondary flex-1 text-xs py-1.5"
        >
          <Icon icon="heroicons:plus-circle" className="w-3.5 h-3.5 mr-1 text-[#FF8A1F]" />
          Task
        </button>
        {onDelete && userRole === 'admin' && (
          <button
            onClick={() => onDelete(client)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Client"
          >
            <Icon icon="heroicons:trash" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const AddClientDrawer = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    status: 'Active',
    service_type: 'Software',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', contact: '', phone: '', email: '', status: 'Active', service_type: 'Software', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md h-full shadow-modal z-50 flex flex-col animate-fade-fast border-l border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="saas-label" htmlFor="client-name">Company Name *</label>
            <input
              id="client-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="saas-input"
              placeholder="Acme Systems Ltd"
            />
          </div>

          <div>
            <label className="saas-label" htmlFor="client-contact">Primary Contact Person *</label>
            <input
              id="client-contact"
              type="text"
              required
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="saas-input"
              placeholder="Sarah Connor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="saas-label" htmlFor="client-phone">Phone *</label>
              <input
                id="client-phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="saas-input"
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="saas-label" htmlFor="client-email">Email</label>
              <input
                id="client-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="saas-input"
                placeholder="sarah@acme.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="saas-label" htmlFor="client-status">Status</label>
              <select
                id="client-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="saas-input"
              >
                {['Active', 'New', 'Pending', 'Inactive'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="saas-label" htmlFor="client-service">Service Type</label>
              <select
                id="client-service"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="saas-input"
              >
                {['Software', 'Consulting', 'Digital Marketing', 'Maintenance', 'Support'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="saas-label" htmlFor="client-notes">Notes</label>
            <textarea
              id="client-notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="saas-input"
              placeholder="Additional client details or contractual notes..."
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Clients = ({ clients, onSelect, onAdd, onCreateTask, searchQuery, userRole, onDelete }) => {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [clientToDelete, setClientToDelete] = useState(null);

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

  const handleExportCSV = () => {
    const headers = ['Company', 'Contact', 'Phone', 'Email', 'Status', 'Service Type'];
    const rows = filteredClients.map(c => [c.name, c.contact, c.phone, c.email || '', c.status, c.service_type || '']);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clients.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your client relationships, organizations, and service contracts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-secondary text-xs flex items-center gap-1.5">
            <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {(userRole === 'admin' || userRole === 'sales') && (
            <button onClick={() => setShowAddDrawer(true)} className="btn-primary text-xs flex items-center gap-1.5">
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-[10px] border border-[#E5E7EB]">
        <Icon icon="heroicons:funnel" className="w-4 h-4 text-gray-400 ml-1" />
        <span className="text-xs font-semibold text-gray-700">Filter Status:</span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-[6px] px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF8A1F]"
        >
          <option value="all">All Clients ({list.length})</option>
          <option value="Active">Active</option>
          <option value="New">New</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Grid Display */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon="heroicons:building-office-2"
          title="No clients found"
          description={searchQuery ? `No results match "${searchQuery}".` : "Add your first client to start managing business accounts."}
          actionLabel={(userRole === 'admin' || userRole === 'sales') ? "Add Client" : null}
          onAction={() => setShowAddDrawer(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onSelect={onSelect}
              onCreateTask={onCreateTask}
              onDelete={(c) => setClientToDelete(c)}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* Add Client Drawer */}
      <AddClientDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        onSubmit={(data) => {
          onAdd(data);
          setShowAddDrawer(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!clientToDelete}
        title="Delete Client Account"
        message={`Are you sure you want to delete "${clientToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Client"
        isDanger={true}
        onConfirm={() => {
          if (clientToDelete && onDelete) {
            onDelete(clientToDelete.id);
          }
          setClientToDelete(null);
        }}
        onCancel={() => setClientToDelete(null)}
      />
    </div>
  );
};

export default Clients;
