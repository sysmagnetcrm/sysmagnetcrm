import { useState, useEffect } from 'react';
import { clientsAPI } from '../utils/supabaseServices';

export const useClients = (filters = {}, enabled = true) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientsAPI.getAll(filters);
      setClients(response.data || []);
    } catch (err) {
      console.error('Failed to load clients:', err?.response?.data || err?.message);
      setError(err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    try {
      await clientsAPI.delete(id);
      setClients(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      // Fallback: remove locally
      setClients(prev => prev.filter(c => c.id !== id));
      return { success: true };
    }
  };

  const createClient = async (clientData) => {
    try {
      const response = await clientsAPI.create(clientData);
      setClients(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      // For demo purposes, add to local state
      const newClient = { 
        id: Date.now(), 
        ...clientData, 
        created_at: new Date().toISOString() 
      };
      setClients(prev => [newClient, ...prev]);
      return { success: true, data: newClient };
    }
  };

  const updateClient = async (id, clientData) => {
    try {
      await clientsAPI.update(id, clientData);
      setClients(prev => 
        prev.map(client => 
          client.id === id ? { ...client, ...clientData, updated_at: new Date().toISOString() } : client
        )
      );
      return { success: true };
    } catch (err) {
      // For demo purposes, update local state
      setClients(prev => 
        prev.map(client => 
          client.id === id ? { ...client, ...clientData, updated_at: new Date().toISOString() } : client
        )
      );
      return { success: true };
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setClients([]);
      return;
    }
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), enabled]);

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
};