import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const CandidateCard = ({ candidate, onSelect, onApprove, onScheduleInterview, onDelete, userRole }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Interviewed': return 'bg-blue-100 text-blue-700';
      case 'Hired': return 'bg-purple-100 text-purple-700';
      default: return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return 'mdi:check-circle-outline';
      case 'Rejected': return 'mdi:close-circle-outline';
      case 'Interviewed': return 'mdi:calendar-check';
      case 'Hired': return 'mdi:account-check-outline';
      default: return 'mdi:clock-outline';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="soft-card p-6 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-grey/5 flex items-center justify-center text-brand-black dark:text-brand-white font-bold text-xl shadow-sm">
          {candidate.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-black dark:text-brand-white truncate text-lg">
            {candidate.name}
          </h3>
          <div className="text-sm text-brand-grey truncate mb-2">
            {candidate.position}
          </div>
          {candidate.resume && (
            <a
              href={candidate.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
            >
              <Icon icon="mdi:file-document-outline" className="w-3.5 h-3.5" />
              View Resume
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${getStatusColor(candidate.status)}`}>
            <Icon icon={getStatusIcon(candidate.status)} className="w-3.5 h-3.5" />
            {candidate.status}
          </span>
          {candidate.interview_date && (
            <div className="text-[10px] font-medium text-brand-grey flex items-center gap-1 bg-brand-grey/5 px-2 py-1 rounded-lg">
              <Icon icon="mdi:calendar-clock" className="w-3 h-3" />
              {new Date(candidate.interview_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {candidate.notes && (
        <div className="text-sm text-brand-grey bg-brand-grey/5 p-3 rounded-xl mb-4 line-clamp-2">
          {candidate.notes}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-brand-grey/10">
        <div className="text-xs font-medium text-brand-grey">
          Applied {new Date(candidate.created_at).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(candidate)}
            className="p-2 rounded-lg hover:bg-brand-grey/10 text-brand-grey transition-colors"
            title="View Details"
          >
            <Icon icon="mdi:eye-outline" className="w-4 h-4" />
          </button>
          {userRole === 'admin' && candidate.status === 'Pending' && (
            <button
              onClick={() => onApprove(candidate.id)}
              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              title="Approve"
            >
              <Icon icon="mdi:check" className="w-4 h-4" />
            </button>
          )}
          {userRole === 'admin' && candidate.status === 'Approved' && (
            <button
              onClick={() => onScheduleInterview(candidate.id)}
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Schedule Interview"
            >
              <Icon icon="mdi:calendar-plus" className="w-4 h-4" />
            </button>
          )}
          {onDelete && userRole === 'admin' && (
            <button
              onClick={() => onDelete(candidate.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
              title="Delete"
            >
              <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AddCandidateModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    resume: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', position: '', resume: '', notes: '' });
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
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Add New Candidate</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="soft-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Position *</label>
            <input
              type="text"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="soft-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Resume URL</label>
            <input
              type="url"
              value={formData.resume}
              onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
              placeholder="https://example.com/resume.pdf"
              className="soft-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional notes..."
              className="soft-input w-full resize-none"
            />
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
              Add Candidate
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ScheduleInterviewModal = ({ isOpen, onClose, onSubmit, candidate }) => {
  const [interviewDate, setInterviewDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(candidate.id, interviewDate);
    setInterviewDate('');
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
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Schedule Interview</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-brand-grey/5 rounded-xl mb-2">
            <div className="text-xs font-bold text-brand-grey uppercase">Candidate</div>
            <div className="font-bold text-brand-black dark:text-brand-white">{candidate?.name}</div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Interview Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="soft-input w-full"
            />
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
              Schedule
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Recruitment = ({ candidates, onSelect, onAdd, onApprove, onScheduleInterview, onDelete, userRole }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  if (userRole === 'developer') {
    return (
      <div className="text-center py-20 soft-card">
        <div className="w-20 h-20 mx-auto bg-brand-grey/10 rounded-full flex items-center justify-center text-brand-grey mb-4">
          <Icon icon="mdi:shield-lock-outline" className="w-10 h-10" />
        </div>
        <div className="text-lg font-bold text-brand-black dark:text-brand-white mb-1">Access Denied</div>
        <div className="text-brand-grey">
          Developers don't have access to recruitment features
        </div>
      </div>
    );
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = filterStatus === 'all' || candidate.status === filterStatus;
    return matchesStatus;
  });

  const handleAddCandidate = async (candidateData) => {
    try {
      await onAdd(candidateData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding candidate:', error);
    }
  };

  const handleApproveCandidate = async (candidateId) => {
    await onApprove(candidateId);
  };

  const handleScheduleInterview = async (candidateId, interviewDate) => {
    await onScheduleInterview(candidateId, interviewDate);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Recruitment</h1>
          <p className="text-brand-grey mt-1">
            Manage candidates and interview schedules
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center gap-2"
        >
          <Icon icon="mdi:plus" className="w-5 h-5" />
          Add Candidate
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10">
          <Icon icon="mdi:filter-variant" className="w-5 h-5 text-brand-grey" />
          <span className="text-sm font-bold text-brand-black dark:text-brand-white">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer"
          >
            <option value="all">All Candidates</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Interviewed">Interviewed</option>
            <option value="Hired">Hired</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-20 soft-card">
          <div className="w-20 h-20 mx-auto bg-brand-grey/5 rounded-full flex items-center justify-center text-brand-grey mb-4">
            <Icon icon="mdi:account-search-outline" className="w-10 h-10" />
          </div>
          <div className="text-lg font-bold text-brand-black dark:text-brand-white mb-1">No candidates found</div>
          <div className="text-brand-grey">
            Add your first candidate to get started
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onSelect={onSelect}
              onApprove={handleApproveCandidate}
              onScheduleInterview={() => {
                setSelectedCandidate(candidate);
                setShowScheduleModal(true);
              }}
              onDelete={onDelete}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCandidate}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleInterview}
        candidate={selectedCandidate}
      />
    </div>
  );
};

export default Recruitment;
