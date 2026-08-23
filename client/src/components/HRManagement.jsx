import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Toast from './Toast';
import { candidatesAPI, employeesAPI } from '../utils/supabaseServices';

const HRManagement = () => {
  const [activeTab, setActiveTab] = useState('hiring');
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await candidatesAPI.getAll({ status: filterStatus });
      setCandidates(res.data || []);
    } catch (error) {
      addToast('Failed to fetch candidates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeesAPI.getAll();
      setEmployees(res.data || []);
    } catch (error) {
      addToast('Failed to fetch employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (emp) => {
    try {
      await employeesAPI.create(emp);
      addToast('Employee added');
      setShowAddEmployee(false);
      fetchEmployees();
    } catch (e) {
      addToast(e.message || 'Failed to add employee', 'error');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    try {
      await employeesAPI.delete(employeeId);
      addToast('Employee removed successfully');
      fetchEmployees();
    } catch (error) {
      addToast(error.message || 'Failed to delete employee', 'error');
    }
  };

  const addToast = (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { id, title: message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleAddCandidate = async (candidateData) => {
    try {
      await candidatesAPI.create(candidateData);
      addToast('Candidate added successfully');
      setShowAddModal(false);
      fetchCandidates();
    } catch (error) {
      addToast('Failed to add candidate', 'error');
    }
  };

  const handleUpdateCandidate = async (id, updates) => {
    try {
      await candidatesAPI.update(id, updates);
      addToast('Candidate updated successfully');
      setEditingCandidate(null);
      fetchCandidates();
    } catch (error) {
      addToast('Failed to update candidate', 'error');
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await candidatesAPI.delete(id);
      addToast('Candidate deleted successfully');
      fetchCandidates();
    } catch (error) {
      addToast('Failed to delete candidate', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-700',
      'screening': 'bg-yellow-100 text-yellow-700',
      'interview': 'bg-purple-100 text-purple-700',
      'offer': 'bg-green-100 text-green-700',
      'hired': 'bg-emerald-100 text-emerald-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredCandidates = candidates.filter(candidate =>
    searchQuery === '' ||
    candidate.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = employees.filter(employee =>
    searchQuery === '' ||
    employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="soft-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white">HR Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('hiring')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'hiring'
                ? 'bg-brand-orange text-white shadow-md'
                : 'bg-brand-grey/10 text-brand-grey hover:bg-brand-grey/20'
                }`}
            >
              Hiring
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'employees'
                ? 'bg-brand-orange text-white shadow-md'
                : 'bg-brand-grey/10 text-brand-grey hover:bg-brand-grey/20'
                }`}
            >
              Employees
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'hiring' ? 'candidates' : 'employees'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soft-input w-full pl-10"
            />
          </div>
          {activeTab === 'hiring' && (
            <>
              <div className="relative">
                <Icon icon="mdi:filter-variant" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="soft-input pl-10 pr-8 appearance-none"
                >
                  <option value="">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center gap-2 px-4"
              >
                <Icon icon="mdi:plus" className="w-5 h-5" />
                Add Candidate
              </button>
            </>
          )}
          {activeTab === 'employees' && (
            <button
              onClick={() => setShowAddEmployee(true)}
              className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center gap-2 px-4"
            >
              <Icon icon="mdi:plus" className="w-5 h-5" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="soft-card p-12 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-brand-grey">Loading...</p>
        </div>
      ) : activeTab === 'hiring' ? (
        <div className="soft-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-grey/10">
              <thead className="bg-brand-grey/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-grey uppercase tracking-wider">
                    Interview Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-brand-grey uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-grey/10">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-brand-grey/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-brand-black dark:text-brand-white">
                          {candidate.candidate_name}
                        </div>
                        <div className="text-xs text-brand-grey">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black dark:text-brand-white">
                      {candidate.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black dark:text-brand-white">
                      {candidate.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black dark:text-brand-white">
                      {candidate.interview_date || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingCandidate(candidate)}
                        className="text-blue-600 hover:text-blue-700 mr-3 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCandidate(candidate.id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-brand-grey/10">
            {filteredCandidates.map((candidate) => (
              <div key={`candidate-mobile-${candidate.id}`} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-brand-black dark:text-brand-white">{candidate.candidate_name}</p>
                    <p className="text-xs text-brand-grey">{candidate.email || 'No email'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-grey">Position</dt>
                    <dd className="mt-1 font-medium text-brand-black dark:text-brand-white">{candidate.position || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-grey">Department</dt>
                    <dd className="mt-1 font-medium text-brand-black dark:text-brand-white">{candidate.department || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-grey">Interview</dt>
                    <dd className="mt-1 font-medium text-brand-black dark:text-brand-white">{candidate.interview_date || 'Not set'}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => setEditingCandidate(candidate)}
                    className="flex-1 soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <Icon icon="mdi:pencil-outline" className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(candidate.id)}
                    className="flex-1 soft-button bg-red-50 text-red-600 hover:bg-red-100 py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <Icon icon="mdi:trash-can-outline" className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="soft-card p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Icon icon="mdi:account" className="w-6 h-6" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-bold text-brand-black dark:text-brand-white">{employee.name}</h3>
                    <p className="text-xs text-brand-grey font-mono">{employee.employee_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg ${employee.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-brand-grey/20 text-brand-grey'
                    }`}>
                    {employee.status}
                  </span>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="text-red-600 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete employee"
                  >
                    <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-grey">Position</span>
                  <span className="font-medium text-brand-black dark:text-brand-white">{employee.position}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-grey">Department</span>
                  <span className="font-medium text-brand-black dark:text-brand-white">{employee.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-grey">Email</span>
                  <span className="font-medium text-brand-black dark:text-brand-white truncate max-w-[150px]">{employee.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-grey">Hire Date</span>
                  <span className="font-medium text-brand-black dark:text-brand-white">{employee.hire_date}</span>
                </div>
                <div className="pt-3 border-t border-brand-grey/10 flex justify-between text-sm">
                  <span className="text-brand-grey">{employee.pay_type === 'fixed' ? 'Salary' : 'Hourly Rate'}</span>
                  <span className="font-bold text-brand-black dark:text-brand-white">
                    ₹{employee.pay_type === 'fixed' ? employee.base_salary?.toLocaleString() : employee.hourly_rate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingCandidate) && (
        <CandidateModal
          candidate={editingCandidate}
          onSave={editingCandidate ? handleUpdateCandidate : handleAddCandidate}
          onClose={() => {
            setShowAddModal(false);
            setEditingCandidate(null);
          }}
        />
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <EmployeeModal
          onSave={handleAddEmployee}
          onClose={() => setShowAddEmployee(false)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} remove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

const CandidateModal = ({ candidate, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    candidate_name: candidate?.candidate_name || '',
    position: candidate?.position || '',
    department: candidate?.department || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    status: candidate?.status || 'applied',
    interview_date: candidate?.interview_date || '',
    interviewer: candidate?.interviewer || '',
    notes: candidate?.notes || '',
    salary_offered: candidate?.salary_offered || '',
    joining_date: candidate?.joining_date || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (candidate) {
      onSave(candidate.id, formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="soft-card w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-brand-black">
        <div className="p-6 border-b border-brand-grey/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-brand-black dark:text-brand-white">
              {candidate ? 'Edit Candidate' : 'Add New Candidate'}
            </h3>
            <button
              onClick={onClose}
              className="text-brand-grey hover:text-brand-black dark:hover:text-brand-white p-2 hover:bg-brand-grey/10 rounded-xl transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Candidate Name *
              </label>
              <input
                type="text"
                required
                value={formData.candidate_name}
                onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                className="soft-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Position *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="soft-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="soft-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="soft-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="soft-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="soft-input w-full"
              >
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {(formData.status === 'interview' || formData.status === 'offer') && (
              <>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    className="soft-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                    Interviewer
                  </label>
                  <input
                    type="text"
                    value={formData.interviewer}
                    onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                    className="soft-input w-full"
                  />
                </div>
              </>
            )}

            {formData.status === 'offer' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                    Salary Offered
                  </label>
                  <input
                    type="number"
                    value={formData.salary_offered}
                    onChange={(e) => setFormData({ ...formData, salary_offered: e.target.value })}
                    className="soft-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="soft-input w-full"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="soft-input w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-grey/10">
            <button
              type="button"
              onClick={onClose}
              className="soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 px-6"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 px-6"
            >
              {candidate ? 'Update' : 'Add'} Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRManagement;

const EmployeeModal = ({ onSave, onClose }) => {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    department: '',
    position: '',
    status: 'active',
    employee_id: '',
    hire_date: '',
    pay_type: 'fixed',
    base_salary: '',
    hourly_rate: ''
  });

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.pay_type === 'fixed') payload.hourly_rate = null;
    else payload.base_salary = null;
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="soft-card w-full max-w-2xl bg-white dark:bg-[#121212]">
        <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-brand-black dark:text-brand-white">Add Employee</h3>
          <button onClick={onClose} className="text-brand-grey hover:text-brand-black dark:hover:text-brand-white p-2 hover:bg-brand-grey/10 rounded-xl transition-colors">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="soft-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="soft-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Department</label>
            <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="soft-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Position</label>
            <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="soft-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Employee ID</label>
            <input value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} className="soft-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Hire Date</label>
            <input type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} className="soft-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="soft-input w-full">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Pay Type</label>
            <select value={form.pay_type} onChange={e => setForm(f => ({ ...f, pay_type: e.target.value }))} className="soft-input w-full">
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
          {form.pay_type === 'fixed' ? (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Base Salary (₹)</label>
              <input type="number" value={form.base_salary} onChange={e => setForm(f => ({ ...f, base_salary: e.target.value }))} className="soft-input w-full" />
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Hourly Rate (₹)</label>
              <input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} className="soft-input w-full" />
            </div>
          )}
          <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-brand-grey/10">
            <button type="button" onClick={onClose} className="soft-button bg-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/20 px-6">Cancel</button>
            <button type="submit" className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 px-6">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};
