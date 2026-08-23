import { useState, useEffect } from 'react';
import { usersAPI } from '../utils/supabaseServices';

export const useUsers = (filters = {}, enabled = true) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.getAll();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to load users:', err?.response?.data || err?.message);
      setError(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await usersAPI.create(userData);
      setUsers(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const updateUser = async (id, userData) => {
    try {
      await usersAPI.update(id, userData);
      setUsers(prev => 
        prev.map(user => 
          user.id === id ? { ...user, ...userData, updated_at: new Date().toISOString() } : user
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const deleteUser = async (id) => {
    try {
      await usersAPI.delete(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setUsers([]);
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), enabled]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
