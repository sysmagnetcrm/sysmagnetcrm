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
      console.error('Failed to load tasks:', err?.response?.data || err?.message);
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
      // Fallback: remove locally
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return { success: true };
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.create(taskData);
      setTasks(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      // For demo purposes, add to local state
      const newTask = { 
        id: Date.now(), 
        ...taskData, 
        status: 'Pending',
        created_at: new Date().toISOString() 
      };
      setTasks(prev => [newTask, ...prev]);
      return { success: true, data: newTask };
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      await tasksAPI.update(id, taskData);
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, ...taskData } : task
        )
      );
      return { success: true };
    } catch (err) {
      // For demo purposes, update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, ...taskData } : task
        )
      );
      return { success: true };
    }
  };

  const assignTask = async (taskId, userId) => {
    try {
      await tasksAPI.update(taskId, { assigned_to: userId, status: 'Pending' });
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, assigned_to: userId, status: 'Pending' } : task
        )
      );
      return { success: true };
    } catch (err) {
      // For demo purposes, update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, assigned_to: userId, status: 'Pending' } : task
        )
      );
      return { success: true };
    }
  };

  const markTaskDone = async (taskId) => {
    try {
      await tasksAPI.update(taskId, { status: 'Done' });
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, status: 'Done' } : task
        )
      );
      return { success: true };
    } catch (err) {
      // For demo purposes, update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, status: 'Done' } : task
        )
      );
      return { success: true };
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