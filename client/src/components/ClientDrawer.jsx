import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import EronSelect from './EronSelect';

const ClientDrawer = ({ client, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: client?.name || '',
    contact: client?.contact || '',
    phone: client?.phone || '',
    email: client?.email || '',
    status: client?.status || 'New',
    source: client?.source || 'Manual',
    serviceType: client?.serviceType || client?.service || '',
    notes: client?.notes || ''
  });
  const [customService, setCustomService] = useState('');
  const serviceOptions = ['Web Development', 'ERP', 'SEO', 'SMM', 'Mobile App', 'Branding', 'Consulting', 'Other'];

  const handleSave = async () => {
    const payload = {
      ...formData,
      service_type: formData.serviceType || formData.service || '',
      service: formData.serviceType || formData.service || '',
    };
    if (onUpdate) {
      const res = await onUpdate(client.id, payload);
      if (res && res.success === false) {
        console.error('Client update failed:', res.error);
        return;
      }
    }
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-brand-orange/10 text-brand-orange';
      case 'Contacted': return 'bg-brand-yellow/10 text-brand-yellow';
      case 'Qualified': return 'bg-green-100 text-green-700';
      case 'Proposal': return 'bg-blue-100 text-blue-700';
      case 'Closed': return 'bg-brand-black text-white';
      default: return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end !mt-0 m-0">
      <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-50" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative bg-white w-full sm:w-[560px] h-screen flex flex-col z-50 border-l border-[#E4E7EC] shadow-modal rounded-none"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between bg-white/50 dark:bg-brand-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Icon icon="mdi:briefcase-account" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">Client Details</h2>
                <p className="text-xs text-brand-grey">ID: {client?.id?.slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="p-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                  title="Save Changes"
                >
                  <Icon icon="mdi:check" className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-xl bg-brand-grey/5 text-brand-grey hover:bg-brand-grey/10 transition-colors"
                  title="Edit Client"
                >
                  <Icon icon="mdi:pencil" className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-brand-grey/5 text-brand-grey hover:bg-brand-grey/10 transition-colors"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Status Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-grey/5 border border-brand-grey/10">
              <span className="text-sm font-medium text-brand-grey">Current Status</span>
              {isEditing ? (
                <EronSelect
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  width="w-[160px]"
                  options={['New', 'Contacted', 'Qualified', 'Proposal', 'Closed'].map(s => ({ value: s, label: s }))}
                />
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(client?.status)}`}>
                  {client?.status || 'New'}
                </span>
              )}
            </div>

            {/* General Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-brand-grey uppercase tracking-wider">General Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Company Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="soft-input w-full"
                      />
                    ) : (
                      <div className="text-base font-bold text-brand-black dark:text-brand-white">
                        {client?.name}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Primary Contact</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="soft-input w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-brand-black dark:text-brand-white">
                        <Icon icon="mdi:account" className="w-4 h-4 text-brand-grey" />
                        {client?.contact}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Source</label>
                    {isEditing ? (
                      <EronSelect
                        value={formData.source}
                        onChange={(val) => setFormData({ ...formData, source: val })}
                        options={['Manual', 'Website', 'Referral', 'Social Media', 'Cold Call'].map(s => ({ value: s, label: s }))}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-brand-black dark:text-brand-white">
                        <Icon icon="mdi:bullhorn" className="w-4 h-4 text-brand-grey" />
                        {client?.source}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="soft-input w-full"
                      />
                    ) : (
                      <a href={`mailto:${client?.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-brand-grey/5 hover:bg-brand-yellow/60/5 hover:text-brand-orange transition-colors group">
                        <div className="p-2 rounded-lg bg-white dark:bg-brand-black text-brand-grey group-hover:text-brand-orange shadow-sm">
                          <Icon icon="mdi:email" className="w-4 h-4" />
                        </div>
                        <span className="font-medium truncate">{client?.email}</span>
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="soft-input w-full"
                      />
                    ) : (
                      <a href={`tel:${client?.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-brand-grey/5 hover:bg-brand-yellow/60/5 hover:text-brand-orange transition-colors group">
                        <div className="p-2 rounded-lg bg-white dark:bg-brand-black text-brand-grey group-hover:text-brand-orange shadow-sm">
                          <Icon icon="mdi:phone" className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{client?.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Service & Notes */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-brand-grey uppercase tracking-wider">Details</h3>

              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Service Interest</label>
                {isEditing ? (
                  <EronSelect
                    value={serviceOptions.includes(formData.serviceType) ? formData.serviceType : 'Other'}
                    onChange={(val) => {
                      if (val !== 'Other') setFormData({ ...formData, serviceType: val });
                    }}
                    options={serviceOptions.map(opt => ({ value: opt, label: opt }))}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-brand-black dark:text-brand-white font-medium">
                    <Icon icon="mdi:cog" className="w-4 h-4 text-brand-grey" />
                    {client?.serviceType || client?.service || 'N/A'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Notes</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="soft-input w-full"
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-brand-grey/5 text-sm text-brand-black dark:text-brand-white leading-relaxed">
                    {client?.notes || 'No notes added yet.'}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-brand-grey/10 bg-brand-grey/5">
            <div className="flex items-center justify-between text-xs text-brand-grey">
              <span>Created: {new Date(client?.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(client?.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
};

export default ClientDrawer;
