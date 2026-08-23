import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const TaskItem = ({ task, onSelect, onAssign, userRole, users = [] }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-brand-grey/10 text-brand-grey';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 border-red-100';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'Low': return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-brand-grey bg-brand-grey/5 border-brand-grey/10';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(task)}
      className={`
        group p-4 rounded-2xl transition-all duration-200 cursor-pointer border
        ${isOverdue
          ? 'bg-red-50/50 border-red-100 hover:bg-red-50'
          : 'bg-white dark:bg-brand-grey/5 border-transparent hover:border-brand-orange/20 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-brand-black dark:text-brand-white truncate group-hover:text-brand-orange transition-colors">
              {task.title}
            </h4>
            {isOverdue && (
              <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-brand-grey mb-3">
            <span className="capitalize flex items-center gap-1">
              <Icon icon="mdi:tag-outline" className="w-3.5 h-3.5" />
              {task.type}
            </span>
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <Icon icon="mdi:calendar-clock" className="w-3.5 h-3.5" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
            {task.assigned_user_name && (
              <div className="flex items-center gap-1">
                <Icon icon="mdi:account-circle-outline" className="w-3.5 h-3.5" />
                {task.assigned_user_name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            {task.priority && (
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
          {userRole === 'admin' && (
            <select
              value={task.assigned_to || ''}
              onChange={(e) => onAssign(task.id, Number(e.target.value))}
              className="text-xs font-medium border-none bg-brand-grey/5 rounded-lg px-2 py-1.5 text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-orange/20 cursor-pointer hover:bg-brand-grey/10 transition-colors"
            >
              <option value="">Assign</option>
              {users
                .filter(u => u.role === 'developer')
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          )}

          <button className="p-2 rounded-lg text-brand-grey hover:bg-brand-yellow/60/10 hover:text-brand-orange transition-colors opacity-0 group-hover:opacity-100">
            <Icon icon="mdi:chevron-right" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const TaskList = ({ tasks, loading, onSelect, onAssign, userRole, users = [], title = 'Tasks' }) => {
  if (loading) {
    return (
      <div className="soft-card p-6">
        <h3 className="font-bold text-lg text-brand-black dark:text-brand-white mb-4">{title}</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 p-4">
              <div className="h-12 w-12 bg-brand-grey/10 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-brand-grey/10 rounded w-3/4"></div>
                <div className="h-3 bg-brand-grey/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="soft-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl text-brand-black dark:text-brand-white">{title}</h3>
        <button className="p-2 rounded-xl hover:bg-brand-grey/5 text-brand-grey transition-colors">
          <Icon icon="mdi:dots-horizontal" className="w-5 h-5" />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-brand-grey/10 rounded-2xl">
          <div className="w-16 h-16 mx-auto bg-brand-grey/5 rounded-full flex items-center justify-center text-brand-grey mb-4">
            <Icon icon="mdi:clipboard-text-off-outline" className="w-8 h-8 opacity-50" />
          </div>
          <div className="text-brand-black dark:text-brand-white font-bold mb-1">No tasks found</div>
          <div className="text-sm text-brand-grey">
            Create your first task to get started
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onSelect={onSelect}
              onAssign={onAssign}
              userRole={userRole}
              users={users}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
