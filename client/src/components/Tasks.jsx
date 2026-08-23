import React, { useState } from 'react';
import { Icon } from '@iconify/react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md h-full shadow-modal z-50 flex flex-col animate-fade-fast border-l border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Create New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="saas-label" htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="saas-input"
              placeholder="e.g. Follow up on Q3 proposal"
            />
          </div>

          <div>
            <label className="saas-label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="saas-input"
              placeholder="Details and action items..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="saas-label" htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="saas-input"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="saas-label" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="saas-input"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="saas-label" htmlFor="task-due">Due Date</label>
            <input
              id="task-due"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="saas-input"
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="space-y-6 py-2">
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
