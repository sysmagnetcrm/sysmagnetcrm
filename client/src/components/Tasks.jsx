import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const TaskCard = ({ task, onSelect, onMarkDone, onDelete, userRole }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-brand-grey bg-brand-grey/5';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(task)}
      className={`p-4 rounded-xl shadow-sm border transition-all hover:shadow-md cursor-pointer group
        ${isOverdue ? 'border-red-200 bg-red-50/50' : 'bg-white dark:bg-brand-grey/5 border-transparent hover:border-brand-orange/20'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-brand-black dark:text-brand-white truncate text-sm">{task.title}</h3>
        {isOverdue && <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-500 flex-shrink-0" />}
      </div>

      {task.description && (
        <p className="text-xs text-brand-grey line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-md bg-brand-grey/10 text-brand-grey text-[10px] font-bold uppercase tracking-wide">
          {task.type}
        </span>
        {task.priority && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-brand-grey/10">
        <div className="flex items-center gap-2">
          {task.assigned_user_name ? (
            <div className="w-6 h-6 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-[10px] font-bold">
              {task.assigned_user_name.charAt(0)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-grey/10 flex items-center justify-center text-brand-grey">
              <Icon icon="mdi:account-question" className="w-3.5 h-3.5" />
            </div>
          )}
          {task.due_date && (
            <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-brand-grey'}`}>
              <Icon icon="mdi:calendar" className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {userRole === 'developer' && task.status !== 'Done' && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkDone(task.id); }}
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
              title="Mark Done"
            >
              <Icon icon="mdi:check" className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && userRole === 'admin' && (
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete?')) onDelete(task.id); }}
              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
              title="Delete"
            >
              <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AddTaskModal = ({ isOpen, onClose, onSubmit, users }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general',
    assigned_to: '',
    client_id: '',
    due_date: '',
    priority: 'Medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', description: '', type: 'general', assigned_to: '', client_id: '', due_date: '', priority: 'Medium' });
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
          <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Add New Task</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="soft-input w-full"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="soft-input w-full resize-none"
              placeholder="Details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="soft-input w-full"
              >
                {['general', 'demo', 'challenge', 'interview'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="soft-input w-full"
              >
                {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="soft-input w-full"
              >
                <option value="">Unassigned</option>
                {users
                  .filter(u => (u.role || '').toLowerCase() !== 'client')
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-grey mb-1.5 ml-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="soft-input w-full"
              />
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
              Add Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Tasks = ({ tasks, users, onSelect, onAssign, onMarkDone, onCreate, onDelete, userRole }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesPriority = filterPriority === 'all' || (task.priority || '').toLowerCase() === filterPriority.toLowerCase();
    return matchesStatus && matchesType && matchesPriority;
  });

  const groups = useMemo(() => {
    const order = ['Pending', 'In Progress', 'Done', 'Cancelled'];
    const map = order.reduce((acc, k) => { acc[k] = []; return acc; }, {});
    filteredTasks.forEach(t => { (map[t.status] || (map[t.status] = [])).push(t); });
    const dot = {
      'Pending': 'bg-amber-500',
      'In Progress': 'bg-blue-500',
      'Done': 'bg-emerald-500',
      'Cancelled': 'bg-slate-400'
    };
    return { order, map, dot };
  }, [filteredTasks]);

  const handleAddTask = async (taskData) => {
    try {
      if (onCreate) {
        await onCreate(taskData);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Tasks</h1>
          <p className="text-brand-grey mt-1">
            Track and manage your tasks and assignments
          </p>
        </div>
        {userRole !== 'developer' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 flex items-center gap-2"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10">
          <Icon icon="mdi:filter-variant" className="w-5 h-5 text-brand-grey" />
          <span className="text-sm font-bold text-brand-black dark:text-brand-white whitespace-nowrap">Filter:</span>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer">
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer">
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="demo">Demo</option>
            <option value="challenge">Challenge</option>
            <option value="interview">Interview</option>
          </select>
        </div>
        <div className="px-4 py-2 rounded-xl bg-white dark:bg-brand-grey/5 border border-brand-grey/10">
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-transparent border-none text-sm font-medium text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer">
            <option value="all">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks Columns */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-20 soft-card">
          <div className="w-20 h-20 mx-auto bg-brand-grey/5 rounded-full flex items-center justify-center text-brand-grey mb-4">
            <Icon icon="mdi:clipboard-text-off-outline" className="w-10 h-10" />
          </div>
          <div className="text-lg font-bold text-brand-black dark:text-brand-white mb-1">No tasks found</div>
          <div className="text-brand-grey">
            Create your first task to get started
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {groups.order.map((status) => (
            <div key={status} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${groups.dot[status]} shadow-sm`}></span>
                  <h3 className="font-bold text-brand-black dark:text-brand-white">{status}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-brand-grey/10 text-brand-grey">
                  {groups.map[status]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {(groups.map[status] || []).map((task) => (
                  <TaskCard key={task.id} task={task} onSelect={onSelect} onMarkDone={onMarkDone} onDelete={onDelete} userRole={userRole} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTask}
        users={users}
      />
    </div>
  );
};

export default Tasks;
