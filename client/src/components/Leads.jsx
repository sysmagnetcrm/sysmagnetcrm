import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import PageHeader from './PageHeader';
import StatCard from './StatCard';
import FilterBar from './FilterBar';
import FormDrawer from './FormDrawer';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import ConfirmDialog from './ConfirmDialog';

const LeadCard = ({ lead, onSelect, onCall, onMail, onQualify, onConvert, onDelete, onEdit, userRole, salesUsers = [], onAssignTo }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'New': return 'badge-info';
      case 'Contacted': return 'badge-warning';
      case 'Qualified': return 'badge-success';
      case 'Unqualified': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(lead)}
      className="saas-card p-4 saas-card-hover flex flex-col justify-between cursor-pointer group"
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-[#111827] truncate text-base mb-0.5" title={lead.name}>
              {lead.name}
            </h3>
            <p className="text-xs text-[#667085] truncate">{lead.contact || 'No primary contact'}</p>
          </div>
          <span className={`badge ${getStatusBadge(lead.status)}`}>
            {lead.status || 'New'}
          </span>
        </div>

        {/* Contact info block */}
        <div className="space-y-1.5 mb-3 py-2 border-y border-[#E4E7EC] text-xs text-[#667085]">
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:phone" className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
            <span className="truncate">{lead.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:envelope" className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
            <span className="truncate">{lead.email || 'No email'}</span>
          </div>
          {lead.source && (
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:tag" className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
              <span className="truncate">{lead.source}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onCall(lead); }}
            className="p-1.5 text-[#667085] hover:text-[#12B76A] hover:bg-[#F6FEF9] rounded-[6px] transition-colors"
            title="Call Lead"
          >
            <Icon icon="heroicons:phone" className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMail(lead); }}
            className="p-1.5 text-[#667085] hover:text-[#3B82F6] hover:bg-[#EFF8FF] rounded-[6px] transition-colors"
            title="Email Lead"
          >
            <Icon icon="heroicons:envelope" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
            className="p-1.5 text-[#667085] hover:text-[#FF8A1F] hover:bg-[#FFF4E8] rounded-[6px] transition-colors"
            title="Edit Lead"
          >
            <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
          </button>
          {onDelete && (userRole === 'admin' || userRole === 'digital_marketer') && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
              className="p-1.5 text-[#667085] hover:text-[#F04438] hover:bg-[#FEF3F2] rounded-[6px] transition-colors"
              title="Delete Lead"
            >
              <Icon icon="heroicons:trash" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Leads = ({
  leads = [],
  onCreateLead,
  onUpdateLead,
  onQualify,
  onConvert,
  onDeleteLead,
  onBulkImport,
  onAssignLead,
  salesAgents = [],
  userRole = 'sales',
  loading = false,
  error = null,
  onRetry,
}) => {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLeadId, setDeletingLeadId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters state
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    source: 'all',
    service: 'all',
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    status: 'New',
    source: 'Manual Entry',
    service: 'Web Development',
    value: '',
    notes: '',
  });

  // Metrics
  const counts = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter(l => l.status === 'New').length;
    const contacted = leads.filter(l => l.status === 'Contacted').length;
    const qualified = leads.filter(l => l.status === 'Qualified').length;
    const unqualified = leads.filter(l => l.status === 'Unqualified').length;
    return { total, newCount, contacted, qualified, unqualified };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (l.name || '').toLowerCase().includes(q) ||
        (l.contact || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q);

      const matchesStatus = activeFilters.status === 'all' || (l.status || 'New').toLowerCase() === activeFilters.status.toLowerCase();
      const matchesSource = activeFilters.source === 'all' || (l.source || '').toLowerCase() === activeFilters.source.toLowerCase();
      const matchesService = activeFilters.service === 'all' || (l.service || '').toLowerCase() === activeFilters.service.toLowerCase();

      return matchesSearch && matchesStatus && matchesSource && matchesService;
    });
  }, [leads, searchQuery, activeFilters]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      contact: '',
      phone: '',
      email: '',
      status: 'New',
      source: 'Manual Entry',
      service: 'Web Development',
      value: '',
      notes: '',
    });
    setShowAddDrawer(true);
  };

  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      contact: lead.contact || '',
      phone: lead.phone || '',
      email: lead.email || '',
      status: lead.status || 'New',
      source: lead.source || 'Manual Entry',
      service: lead.service || 'Web Development',
      value: lead.value || '',
      notes: lead.notes || '',
    });
    setShowAddDrawer(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLead) {
        await onUpdateLead(editingLead.id, formData);
      } else {
        await onCreateLead(formData);
      }
      setShowAddDrawer(false);
    } catch (err) {
      console.error('Lead save error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: 'all', source: 'all', service: 'all' });
    setSearchQuery('');
  };

  return (
    <div className="space-y-5 py-1 font-sans">
      {/* Standardized Page Header */}
      <PageHeader
        category="SALES MANAGEMENT"
        title="Leads"
        subtitle="Track sales opportunities and manage conversion pipeline."
        primaryActionLabel="Add Lead"
        onPrimaryAction={handleOpenAdd}
        exportActionLabel="Export"
        onExportAction={() => console.log('Export leads')}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="New"
          value={counts.newCount}
          icon="heroicons:user-plus"
          iconColor="text-[#3B82F6]"
          iconBg="bg-[#EFF8FF]"
          supportingText="Uncontacted leads"
          onClick={() => handleFilterChange('status', 'New')}
        />
        <StatCard
          label="Contacted"
          value={counts.contacted}
          icon="heroicons:chat-bubble-left-right"
          iconColor="text-[#F79009]"
          iconBg="bg-[#FFFAEB]"
          supportingText="Active discussions"
          onClick={() => handleFilterChange('status', 'Contacted')}
        />
        <StatCard
          label="Qualified"
          value={counts.qualified}
          icon="heroicons:check-circle"
          iconColor="text-[#12B76A]"
          iconBg="bg-[#F6FEF9]"
          supportingText="Ready for conversion"
          onClick={() => handleFilterChange('status', 'Qualified')}
        />
        <StatCard
          label="Unqualified"
          value={counts.unqualified}
          icon="heroicons:x-circle"
          iconColor="text-[#F04438]"
          iconBg="bg-[#FEF3F2]"
          supportingText="Archived leads"
          onClick={() => handleFilterChange('status', 'Unqualified')}
        />
      </div>

      {/* Standardized Filter & Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search leads by company, contact or email..."
        primaryFilters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'New', label: 'New' },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Qualified', label: 'Qualified' },
              { value: 'Unqualified', label: 'Unqualified' },
            ],
          },
          {
            key: 'source',
            label: 'Source',
            options: [
              { value: 'Website', label: 'Website' },
              { value: 'Referral', label: 'Referral' },
              { value: 'Manual Entry', label: 'Manual Entry' },
              { value: 'LinkedIn', label: 'LinkedIn' },
            ],
          },
        ]}
        advancedFilters={[
          {
            key: 'service',
            label: 'Service Interested',
            type: 'select',
            options: [
              { value: 'Web Development', label: 'Web Development' },
              { value: 'Mobile App', label: 'Mobile App' },
              { value: 'UI/UX Design', label: 'UI/UX Design' },
              { value: 'Cloud Solutions', label: 'Cloud Solutions' },
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
          title="Unable to load leads"
          description="Something went wrong while fetching leads from the server."
          onRetry={onRetry}
        />
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon="heroicons:user-group"
          title="No leads found"
          description={searchQuery || activeFilters.status !== 'all' ? "No leads match your active filters." : "Add your first lead to start building your sales pipeline."}
          actionLabel="Add Lead"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onCall={(l) => window.open(`tel:${l.phone}`)}
              onMail={(l) => window.open(`mailto:${l.email}`)}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeletingLeadId(id)}
              userRole={userRole}
              salesUsers={salesAgents}
              onAssignTo={(id, agentId) => onAssignLead && onAssignLead(id, agentId)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Lead Drawer */}
      <FormDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        title={editingLead ? "Edit Lead" : "Add New Lead"}
        subtitle="Enter lead details to track conversion opportunities."
        submitLabel={editingLead ? "Update Lead" : "Create Lead"}
        submitting={submitting}
        onSubmit={handleFormSubmit}
      >
        {/* Section 1: Company & Contact */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E4E7EC] pb-1.5">
            Company & Contact Information
          </h4>

          <div>
            <label className="saas-label">Company / Organization Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Acme Corp"
              className="saas-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saas-label">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="e.g. Rahul Sharma"
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
              placeholder="rahul@acmecorp.com"
              className="saas-input"
            />
          </div>
        </div>

        {/* Section 2: Lead Details */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E4E7EC] pb-1.5">
            Lead Classification
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saas-label">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="saas-input"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
              </select>
            </div>

            <div>
              <label className="saas-label">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="saas-input"
              >
                <option value="Manual Entry">Manual Entry</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saas-label">Interested Service</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                className="saas-input"
              >
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Cloud Solutions">Cloud Solutions</option>
              </select>
            </div>

            <div>
              <label className="saas-label">Estimated Value (₹)</label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="50000"
                className="saas-input"
              />
            </div>
          </div>

          <div>
            <label className="saas-label">Notes & Context</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional background notes about this sales opportunity..."
              className="saas-input"
            />
          </div>
        </div>
      </FormDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingLeadId}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmLabel="Delete Lead"
        onConfirm={async () => {
          if (deletingLeadId && onDeleteLead) {
            await onDeleteLead(deletingLeadId);
          }
          setDeletingLeadId(null);
        }}
        onCancel={() => setDeletingLeadId(null)}
      />
    </div>
  );
};

export default Leads;
