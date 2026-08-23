import { useEffect, useState } from 'react';
import { paymentsAPI } from '../utils/supabaseServices';

export const usePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await paymentsAPI.getAll();
      setPayments(res.data);
    } catch (e) {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (data) => {
    try {
      const res = await paymentsAPI.create(data);
      setPayments(prev => [res.data, ...prev]);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updatePayment = async (id, patch) => {
    try {
      await paymentsAPI.update(id, patch);
      setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deletePayment = async (id) => {
    try {
      await paymentsAPI.delete(id);
      setPayments(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const sendReminder = async (id, message) => {
    try {
      const res = await paymentsAPI.sendReminder(id, message);
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  return { payments, loading, error, refetch: fetchPayments, createPayment, updatePayment, deletePayment, sendReminder };
};
