import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const CandidateDrawer = ({ candidate, onClose, onApprove, onScheduleInterview, onUpdate, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: candidate?.name || '',
    position: candidate?.position || '',
    resume: candidate?.resume || '',
    notes: candidate?.notes || '',
    status: candidate?.status || 'Pending'
  });

  const handleSave = async () => {
    if (onUpdate && candidate?.id) {
      await onUpdate(candidate.id, formData);
    }
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-brand-yellow/10 text-brand-yellow';
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Interviewed': return 'bg-brand-orange/10 text-brand-orange';
      case 'Hired': return 'bg-brand-black text-white';
      default: return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return 'mdi:check-circle';
      case 'Rejected': return 'mdi:close-circle';
      case 'Interviewed': return 'mdi:calendar-clock';
      case 'Hired': return 'mdi:account-check';
      default: return 'mdi:clock-outline';
    }
  };

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white dark:bg-brand-black shadow-2xl z-50 border-l border-brand-grey/10"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between bg-white/50 dark:bg-brand-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <Icon icon="mdi:account-tie" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">Candidate Details</h2>
              <p className="text-xs text-brand-grey">ID: {candidate?.id?.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey transition-colors"
              title="Close"
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
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="bg-white dark:bg-brand-black border-none rounded-lg text-sm font-bold focus:ring-0 cursor-pointer"
              >
                {['Pending', 'Approved', 'Rejected', 'Interviewed', 'Hired'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(candidate?.status)}`}>
                <Icon icon={getStatusIcon(candidate?.status)} className="w-4 h-4" />
                {candidate?.status}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <section className="space-y-4">
            <div className="group">
              <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="soft-input w-full"
                />
              ) : (
                <div className="text-brand-black dark:text-brand-white font-bold text-xl leading-tight">{candidate?.name}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Position</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="soft-input w-full"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-brand-black dark:text-brand-white font-medium">
                    <Icon icon="mdi:briefcase-outline" className="w-4 h-4 text-brand-grey" />
                    {candidate?.position}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Resume</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.resume}
                    onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                    placeholder="https://example.com/resume.pdf"
                    className="soft-input w-full"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {candidate?.resume ? (
                      <a
                        href={candidate.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-brand-orange hover:text-brand-orange/80 font-medium text-sm"
                      >
                        <Icon icon="mdi:file-document-outline" className="w-4 h-4" />
                        View Resume
                      </a>
                    ) : (
                      <span className="text-brand-grey text-sm italic">No resume provided</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Interview Date */}
          {candidate?.interview_date && (
            <section>
              <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Interview Date</label>
              <div className="p-3 rounded-xl bg-brand-orange/5 border border-brand-orange/10 flex items-center gap-3 text-brand-black dark:text-brand-white">
                <Icon icon="mdi:calendar-clock" className="w-5 h-5 text-brand-orange" />
                <span className="font-medium">
                  {new Date(candidate.interview_date).toLocaleDateString()} at {new Date(candidate.interview_date).toLocaleTimeString()}
                </span>
              </div>
            </section>
          )}

          {/* Notes */}
          <section>
            <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Notes</label>
            {isEditing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="soft-input w-full resize-none"
                placeholder="Add notes..."
              />
            ) : (
              <div className="p-4 rounded-2xl bg-brand-grey/5 text-sm leading-relaxed text-brand-black dark:text-brand-white min-h-[100px] whitespace-pre-wrap">
                {candidate?.notes || 'No notes available'}
              </div>
            )}
          </section>

          {/* Actions */}
          <section className="pt-4 border-t border-brand-grey/10">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSave}
                  className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center justify-center gap-2"
                >
                  <Icon icon="mdi:check" className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full soft-button bg-brand-black text-white hover:bg-brand-black/90 flex items-center justify-center gap-2"
                >
                  <Icon icon="mdi:pencil" className="w-5 h-5" />
                  Edit Candidate
                </button>

                {userRole === 'admin' && candidate?.status === 'Pending' && (
                  <button
                    onClick={() => onApprove(candidate.id)}
                    className="w-full soft-button bg-green-500 text-white hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:check-circle" className="w-5 h-5" />
                    Approve Candidate
                  </button>
                )}

                {userRole === 'admin' && candidate?.status === 'Approved' && (
                  <button
                    onClick={() => onScheduleInterview(candidate.id)}
                    className="w-full soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:calendar-clock" className="w-5 h-5" />
                    Schedule Interview
                  </button>
                )}

                {userRole === 'admin' && candidate?.status === 'Interviewed' && (
                  <button
                    onClick={() => {
                      const newStatus = prompt('Set final status (Hired/Rejected):');
                      if (newStatus === 'Hired' || newStatus === 'Rejected') {
                        // This would update the candidate status
                        console.log('Update candidate status to:', newStatus);
                      }
                    }}
                    className="w-full soft-button bg-brand-black text-white hover:bg-brand-black/80 flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:gavel" className="w-5 h-5" />
                    Set Final Status
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-grey/10 bg-brand-grey/5">
          <div className="flex items-center justify-between text-xs text-brand-grey">
            <span>Applied: {new Date(candidate?.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(candidate?.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default CandidateDrawer;
