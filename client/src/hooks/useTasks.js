import { useState, useEffect } from 'react';
import { tasksAPI } from '../utils/supabaseServices';

export const useTasks = (filters = {}, enabled = true) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tasksAPI.getAll(filters);
      setTasks(response.data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err?.appError?.userMessage || err?.message);
      setError(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting task:', err?.appError?.userMessage || err?.message);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to delete task' };
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.create(taskData);
      setTasks(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating task:', err?.appError?.userMessage || err?.message);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to create task' };
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      await tasksAPI.update(id, taskData);
      setTasks(prev =>
        prev.map(task =>
          task.id === id ? { ...task, ...taskData, updated_at: new Date().toISOString() } : task
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Error updating task:', err?.appError?.userMessage || err?.message);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to update task' };
    }
  };

  const assignTask = async (taskId, userId) => {
    try {
      await tasksAPI.update(taskId, { assigned_to: userId, status: 'Pending' });
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, assigned_to: userId, status: 'Pending', updated_at: new Date().toISOString() } : task
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Error assigning task:', err?.appError?.userMessage || err?.message);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to assign task' };
    }
  };

  const markTaskDone = async (taskId) => {
    try {
      await tasksAPI.update(taskId, { status: 'Done' });
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status: 'Done', updated_at: new Date().toISOString() } : task
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Error marking task done:', err?.appError?.userMessage || err?.message);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to mark task as done' };
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setTasks([]);
      return;
    }
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), enabled]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    assignTask,
    markTaskDone,
    deleteTask,
  };
};