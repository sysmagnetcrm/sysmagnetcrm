import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import FormDrawer from './FormDrawer';
import EronSelect from './EronSelect';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';

const TaskCard = ({ task, onSelect, onMarkDone, onDelete, userRole }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Done':
      case 'done': return 'badge-success';
      case 'In Progress':
      case 'in_progress': return 'badge-info';
      case 'Pending': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'Completed' && task.status !== 'done';

  return (
    <div
      onClick={() => onSelect(task)}
      className={`saas-card p-4 saas-card-hover cursor-pointer flex flex-col justify-between ${
        isOverdue ? 'border-red-200 bg-red-50/20' : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm truncate" title={task.title}>{task.title}</h3>
          {isOverdue && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 shrink-0">
              OVERDUE
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className={`badge ${getStatusBadge(task.status)}`}>
            {task.status || 'Pending'}
          </span>
          {task.priority && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
              {task.priority}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Icon icon="heroicons:calendar" className="w-3.5 h-3.5 text-gray-400" />
          <span>{task.due_date || 'No due date'}</span>
        </div>

        <div className="flex items-center gap-1">
          {onMarkDone && task.status !== 'Completed' && task.status !== 'done' && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkDone(task.id); }}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              title="Mark Completed"
            >
              <Icon icon="heroicons:check-circle" className="w-4 h-4" />
            </button>
          )}
          {onDelete && (userRole === 'admin' || userRole === 'hr') && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task); }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete Task"
            >
              <Icon icon="heroicons:trash" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AddTaskDrawer = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    due_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', description: '', status: 'Pending', priority: 'Medium', due_date: '' });
    onClose();
  };

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      subtitle="Define action items, priority, and completion deadline."
      submitLabel="Create Task"
      onSubmit={handleSubmit}
      ariaLabel="Close create task form"
    >
      <div className="space-y-4">
        <div>
          <label className="saas-label">Task Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="saas-input"
            placeholder="e.g. Follow up on Q3 proposal"
          />
        </div>

        <div>
          <label className="saas-label">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="saas-input min-h-[90px] py-2"
            placeholder="Details and action items..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EronSelect
            label="Status"
            value={formData.status}
            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
            ]}
          />

          <EronSelect
            label="Priority"
            value={formData.priority}
            onChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Urgent', label: 'Urgent' },
            ]}
          />
        </div>

        <div>
          <label className="saas-label">Due Date</label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            className="saas-input"
          />
        </div>
      </div>
    </FormDrawer>
  );
};

const Tasks = ({ tasks = [], onSelect, onMarkDone, onCreateTask, searchQuery, userRole, onDelete }) => {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [taskToDelete, setTaskToDelete] = useState(null);

  const list = Array.isArray(tasks) ? tasks : [];
  const q = String(searchQuery || '').toLowerCase();

  const filteredTasks = list.filter(t => {
    const title = String(t?.title || '').toLowerCase();
    const matchesSearch = title.includes(q);
    const matchesStatus = filterStatus === 'all' || (t.status || 'Pending').toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 py-2 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Organize action items, deadlines, and project deliverables
          </p>
        </div>
        <button onClick={() => setShowAddDrawer(true)} className="btn-primary text-xs flex items-center gap-1.5 self-start md:self-auto">
          <Icon icon="heroicons:plus" className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 overflow-x-auto">
        {['all', 'Pending', 'In Progress', 'Completed'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-all capitalize ${
              filterStatus === st ? 'bg-[#FF8A1F] text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {st === 'all' ? `All Tasks (${list.length})` : st}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="heroicons:clipboard-document-check"
          title="No tasks found"
          description={searchQuery ? `No tasks match "${searchQuery}".` : "You're all caught up! No tasks need your attention right now."}
          actionLabel="Create Task"
          onAction={() => setShowAddDrawer(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onSelect={onSelect}
              onMarkDone={onMarkDone}
              onDelete={(taskObj) => setTaskToDelete(taskObj)}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* Add Task Drawer */}
      <AddTaskDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        onSubmit={(data) => {
          if (onCreateTask) onCreateTask(data);
          setShowAddDrawer(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${taskToDelete?.title}"?`}
        confirmLabel="Delete Task"
        isDanger={true}
        onConfirm={() => {
          if (taskToDelete && onDelete) {
            onDelete(taskToDelete.id);
          }
          setTaskToDelete(null);
        }}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};

export default Tasks;
