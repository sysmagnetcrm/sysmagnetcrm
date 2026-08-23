import { useEffect, useMemo, useState } from 'react';
import { clientTasksAPI, adminClientTasksAPI, staffClientTasksAPI } from '../utils/supabaseServices';

/**
 * useClientTasks
 * mode: 'client' | 'admin' | 'staff'
 */
export const useClientTasks = (mode = 'client', params = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(params || {});

  const listFn = useMemo(() => {
    if (mode === 'admin') return () => adminClientTasksAPI.list(query);
    if (mode === 'staff') return () => staffClientTasksAPI.list(query);
    return () => clientTasksAPI.list(query);
  }, [mode, JSON.stringify(query)]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await listFn();
      setItems(resp.data || []);
    } catch (e) {
      console.error('useClientTasks: list error', e?.response?.data || e?.message);
      setItems([]);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const create = async (payload) => {
    try {
      const resp = await clientTasksAPI.create(payload);
      setItems(prev => [ { ...payload, id: resp.data?.id || Date.now(), status: 'New', created_at: new Date().toISOString() }, ...prev ]);
      return { success: true, data: resp.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e.message };
    }
  };

  const timeline = async (taskId) => {
    try {
      const resp = await clientTasksAPI.timeline(taskId);
      return { success: true, data: resp.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e.message };
    }
  };

  const assign = async (taskId, payload) => {
    try {
      const resp = await adminClientTasksAPI.assign(taskId, payload);
      setItems(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: resp.data?.assignee_id || payload.assignee_id, status: 'In Progress' } : t));
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e.message };
    }
  };

  const approve = async (taskId) => {
    try {
      await adminClientTasksAPI.approve(taskId);
      setItems(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Closed' } : t));
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e.message };
    }
  };

  const requestChanges = async (taskId, message, due_date) => {
    try {
      await adminClientTasksAPI.requestChanges(taskId, message, due_date);
      setItems(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Changes Requested', due_date: due_date || t.due_date } : t));
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e.message };
    }
  };

  const submit = async (taskId, payload) => {
    try {
      await staffClientTasksAPI.submit(taskId, payload);
      setItems(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Submitted' } : t));
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e.message };
    }
  };

  useEffect(() => { refetch(); }, [listFn]);

  return {
    tasks: items,
    loading,
    error,
    refetch,
    setFilters: setQuery,
    // client
    create,
    timeline,
    // admin
    assign,
    approve,
    requestChanges,
    // staff
    submit,
  };
};
