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
      console.error('Error deleting client:', err);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to delete client' };
    }
  };

  const createClient = async (clientData) => {
    try {
      // Standardize field names for database compatibility
      const payload = {
        name: clientData.name,
        contact: clientData.contact || null,
        phone: clientData.phone || null,
        email: clientData.email || null,
        status: clientData.status || 'Active',
        service: clientData.service || clientData.service_type || clientData.serviceType || null,
        service_type: clientData.service_type || clientData.serviceType || clientData.service || null,
        notes: clientData.notes || null,
      };
      const response = await clientsAPI.create(payload);
      setClients(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating client:', err);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to create client' };
    }
  };

  const updateClient = async (id, clientData) => {
    try {
      // Standardize field names for database compatibility
      const payload = {};
      if (clientData.name !== undefined) payload.name = clientData.name;
      if (clientData.contact !== undefined) payload.contact = clientData.contact;
      if (clientData.phone !== undefined) payload.phone = clientData.phone;
      if (clientData.email !== undefined) payload.email = clientData.email;
      if (clientData.status !== undefined) payload.status = clientData.status;
      if (clientData.notes !== undefined) payload.notes = clientData.notes;
      
      const serviceVal = clientData.service_type || clientData.serviceType || clientData.service;
      if (serviceVal !== undefined) {
        payload.service_type = serviceVal;
        payload.service = serviceVal;
      }
      if (clientData.source !== undefined) payload.source = clientData.source;

      await clientsAPI.update(id, payload);
      setClients(prev => 
        prev.map(client => 
          client.id === id ? { ...client, ...payload, updated_at: new Date().toISOString() } : client
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Error updating client:', err);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to update client' };
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