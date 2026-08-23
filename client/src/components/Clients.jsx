import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import PageHeader from './PageHeader';
import StatCard from './StatCard';
import FilterBar from './FilterBar';
import FormDrawer from './FormDrawer';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
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
    <div className="saas-card p-4 saas-card-hover flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-[#111827] truncate text-base mb-0.5" title={client.name}>
              {client.name}
            </h3>
            <p className="text-xs text-[#667085] truncate">{client.contact || client.email || 'No primary contact'}</p>
          </div>
          <span className={`badge ${getStatusBadge(client.status)}`}>
            {client.status || 'Active'}
          </span>
        </div>

        <div className="space-y-1.5 mb-4 py-2 border-y border-[#E4E7EC] text-xs text-[#667085]">
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:phone" className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
            <span className="truncate">{client.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:envelope" className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
            <span className="truncate">{client.email || 'N/A'}</span>
          </div>
          {client.service_type && (
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:briefcase" className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
              <span className="truncate">{client.service_type}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onSelect(client)}
          className="btn-secondary flex-1 py-1.5 text-xs"
        >
          <Icon icon="heroicons:eye" className="w-3.5 h-3.5 mr-1" />
          Details
        </button>
        <button
          onClick={() => onCreateTask(client)}
          className="btn-secondary flex-1 py-1.5 text-xs"
        >
          <Icon icon="heroicons:plus-circle" className="w-3.5 h-3.5 mr-1 text-[#FF8A1F]" />
          Task
        </button>
        {onDelete && userRole === 'admin' && (
          <button
            onClick={() => onDelete(client)}
            className="p-1.5 text-[#667085] hover:text-[#F04438] hover:bg-[#FEF3F2] rounded-[6px] transition-colors"
            title="Delete Client"
          >
            <Icon icon="heroicons:trash" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const Clients = ({
  clients = [],
  onSelectClient,
  onCreateTask,
  onCreateClient,
  onDeleteClient,
  userRole = 'admin',
  loading = false,
  error = null,
  onRetry,
}) => {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    service_type: 'all',
  });

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    status: 'Active',
    service_type: 'Software',
    notes: '',
  });

  // Metrics
  const counts = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'Active').length;
    const newClients = clients.filter(c => c.status === 'New').length;
    const pending = clients.filter(c => c.status === 'Pending').length;
    return { total, active, newClients, pending };
  }, [clients]);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.contact || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q);

      const matchesStatus = activeFilters.status === 'all' || (c.status || 'Active').toLowerCase() === activeFilters.status.toLowerCase();
      const matchesService = activeFilters.service_type === 'all' || (c.service_type || '').toLowerCase() === activeFilters.service_type.toLowerCase();

      return matchesSearch && matchesStatus && matchesService;
    });
  }, [clients, searchQuery, activeFilters]);

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: 'all', service_type: 'all' });
    setSearchQuery('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onCreateClient) {
        await onCreateClient(formData);
      }
      setShowAddDrawer(false);
      setFormData({
        name: '',
        contact: '',
        phone: '',
        email: '',
        status: 'Active',
        service_type: 'Software',
        notes: '',
      });
    } catch (err) {
      console.error('Client creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 py-1 font-sans">
      {/* Standardized Page Header */}
      <PageHeader
        category="CLIENT MANAGEMENT"
        title="Clients"
        subtitle="Manage client organizations, business contacts and account status."
        primaryActionLabel="Add Client"
        onPrimaryAction={() => setShowAddDrawer(true)}
        exportActionLabel="Export"
        onExportAction={() => console.log('Export clients')}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="Active Clients"
          value={counts.active}
          icon="heroicons:building-office-2"
          iconColor="text-[#12B76A]"
          iconBg="bg-[#F6FEF9]"
          supportingText="Active business accounts"
          onClick={() => handleFilterChange('status', 'Active')}
        />
        <StatCard
          label="New Accounts"
          value={counts.newClients}
          icon="heroicons:user-plus"
          iconColor="text-[#3B82F6]"
          iconBg="bg-[#EFF8FF]"
          supportingText="Recently onboarded"
          onClick={() => handleFilterChange('status', 'New')}
        />
        <StatCard
          label="Pending Review"
          value={counts.pending}
          icon="heroicons:clock"
          iconColor="text-[#F79009]"
          iconBg="bg-[#FFFAEB]"
          supportingText="Awaiting confirmation"
          onClick={() => handleFilterChange('status', 'Pending')}
        />
        <StatCard
          label="Total Accounts"
          value={counts.total}
          icon="heroicons:users"
          iconColor="text-[#FF8A1F]"
          iconBg="bg-[#FFF4E8]"
          supportingText="Registered organizations"
          onClick={() => handleClearFilters()}
        />
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search clients by name, contact or email..."
        primaryFilters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'New', label: 'New' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Inactive', label: 'Inactive' },
            ],
          },
          {
            key: 'service_type',
            label: 'Service',
            options: [
              { value: 'Software', label: 'Software' },
              { value: 'Web Design', label: 'Web Design' },
              { value: 'Marketing', label: 'Marketing' },
              { value: 'Consulting', label: 'Consulting' },
            ],
          },
        ]}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Main Grid View */}
      {error ? (
        <ErrorState
          title="Unable to load clients"
          description="Something went wrong while retrieving client organizations from the server."
          onRetry={onRetry}
        />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon="heroicons:building-office-2"
          title="No clients yet"
          description="Add your first client to start managing business accounts and project deliverables."
          actionLabel="Add Client"
          onAction={() => setShowAddDrawer(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onSelect={onSelectClient}
              onCreateTask={onCreateTask}
              onDelete={(c) => setDeletingClient(c)}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* Standardized Form Drawer */}
      <FormDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        title="Add New Client"
        subtitle="Create a new client organization profile."
        submitLabel="Add Client"
        submitting={submitting}
        onSubmit={handleFormSubmit}
      >
        {/* Section 1: Company Information */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E4E7EC] pb-1.5">
            Company Information
          </h4>

          <div>
            <label className="saas-label">Company Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Acme Solutions Pvt Ltd"
              className="saas-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saas-label">Primary Contact *</label>
              <input
                type="text"
                required
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="e.g. Vikram Verma"
                className="saas-input"
              />
            </div>
            <div>
              <label className="saas-label">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="saas-input"
              />
            </div>
          </div>

          <div>
            <label className="saas-label">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@acmesolutions.com"
              className="saas-input"
            />
          </div>
        </div>

        {/* Section 2: Client Details */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E4E7EC] pb-1.5">
            Client Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saas-label">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="saas-input"
              >
                <option value="Active">Active</option>
                <option value="New">New</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="saas-label">Service Type</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                className="saas-input"
              >
                <option value="Software">Software</option>
                <option value="Web Design">Web Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Consulting">Consulting</option>
              </select>
            </div>
          </div>

          <div>
            <label className="saas-label">Additional Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Important account notes or SLA details..."
              className="saas-input"
            />
          </div>
        </div>
      </FormDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingClient}
        title="Delete Client Account"
        message={`Are you sure you want to delete ${deletingClient?.name}? All associated records may be impacted.`}
        confirmLabel="Delete Client"
        onConfirm={async () => {
          if (deletingClient && onDeleteClient) {
            await onDeleteClient(deletingClient.id);
          }
          setDeletingClient(null);
        }}
        onCancel={() => setDeletingClient(null)}
      />
    </div>
  );
};

export default Clients;
