import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const TaskDrawer = ({ task, onClose, onUpdate, onMarkDone, users, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'general',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'Pending'
  });

  const handleSave = async () => {
    if (onUpdate && task?.id) {
      try {
        await onUpdate(task.id, formData);
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };

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

  const isOverdue = task?.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

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
              <Icon icon="mdi:checkbox-marked-circle-outline" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">Task Details</h2>
              <p className="text-xs text-brand-grey">ID: {task?.id?.slice(0, 8)}</p>
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
                {['Pending', 'In Progress', 'Done', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(task?.status)}`}>
                {task?.status}
              </span>
            )}
          </div>

          {/* Task Info */}
          <section className="space-y-4">
            <div className="group">
              <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Task Title</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="soft-input w-full"
                />
              ) : (
                <div className="text-brand-black dark:text-brand-white font-bold text-xl leading-tight">{task?.title}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Priority</label>
                {isEditing ? (
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="soft-input w-full"
                  >
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold ${getPriorityColor(task?.priority)}`}>
                    {task?.priority}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Type</label>
                {isEditing ? (
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="soft-input w-full"
                  >
                    {['general', 'demo', 'challenge', 'interview'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-brand-black dark:text-brand-white capitalize font-medium">
                    <Icon icon="mdi:tag-outline" className="w-4 h-4 text-brand-grey" />
                    {task?.type}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Due Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="soft-input w-full"
                  />
                ) : (
                  <div className={`flex items-center gap-2 font-medium ${isOverdue ? 'text-red-500' : 'text-brand-black dark:text-brand-white'}`}>
                    <Icon icon="mdi:calendar" className="w-4 h-4" />
                    {task?.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    {isOverdue && <Icon icon="mdi:alert-circle" className="w-4 h-4" />}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Assigned To</label>
                {isEditing ? (
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
                ) : (
                  <div className="flex items-center gap-2 text-brand-black dark:text-brand-white font-medium">
                    <div className="w-6 h-6 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-xs">
                      {task?.assigned_user_name?.charAt(0) || <Icon icon="mdi:account" className="w-3 h-3" />}
                    </div>
                    {task?.assigned_user_name || 'Unassigned'}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <label className="block text-xs font-medium text-brand-grey mb-1.5 ml-1">Description</label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="soft-input w-full resize-none"
                placeholder="Add task description..."
              />
            ) : (
              <div className="p-4 rounded-2xl bg-brand-grey/5 text-sm leading-relaxed text-brand-black dark:text-brand-white min-h-[100px] whitespace-pre-wrap">
                {task?.description || 'No description available'}
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
                  Edit Task
                </button>

                {userRole === 'developer' && task?.status !== 'Done' && (
                  <button
                    onClick={() => onMarkDone(task.id)}
                    className="w-full soft-button bg-green-500 text-white hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:check-circle" className="w-5 h-5" />
                    Mark as Done
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-grey/10 bg-brand-grey/5">
          <div className="flex items-center justify-between text-xs text-brand-grey">
            <span>Created: {new Date(task?.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(task?.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default TaskDrawer;
