import { useState, useEffect } from 'react';
import { clientsAPI } from '../utils/supabaseServices';

/**
 * Live Supabase `public.clients` columns (verified 2026-09-22):
 *   id, name, email, phone, contact, status, service_type, service,
 *   total_amount, paid_amount, notes, user_id, source, created_at, updated_at
 *
 * NOTE: The column is `contact` (NOT contact_person). `source` and `service` also exist.
 */
export const useClients = (filters = {}, enabled = true) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientsAPI.getAll(filters);
      const rawList = response.data || [];
      // Normalize so UI always has both `contact` and `service_type`
      const normalized = rawList.map(c => ({
        ...c,
        contact: c.contact || '',
        service_type: c.service_type || c.service || '',
      }));
      setClients(normalized);
    } catch (err) {
      console.error('Failed to load clients:', err?.appError?.userMessage || err?.message);
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
      console.error('Error deleting client:', err?.appError?.userMessage || err?.message);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to delete client' };
    }
  };

  const createClient = async (clientData) => {
    try {
      // Only send columns that exist in the live `public.clients` table
      const payload = {
        name: clientData.name,
        contact: clientData.contact || clientData.contact_person || null,
        phone: clientData.phone || null,
        email: clientData.email || null,
        status: clientData.status || 'Active',
        service_type: clientData.service_type || clientData.serviceType || clientData.service || null,
        notes: clientData.notes || null,
        source: clientData.source || 'Manual',
      };

      console.log('[createClient] Sending payload:', payload);

      const response = await clientsAPI.create(payload);
      const created = {
        ...(response.data || payload),
        id: response.data?.id || `client-${Date.now()}`,
        contact: response.data?.contact || payload.contact || '',
        service_type: response.data?.service_type || payload.service_type || '',
        created_at: response.data?.created_at || new Date().toISOString(),
      };
      setClients(prev => [created, ...prev]);
      return { success: true, data: created };
    } catch (err) {
      console.error('Error creating client:', err?.appError?.userMessage || err?.message);
      return { success: false, error: err?.appError?.userMessage || err?.message || 'Failed to create client' };
    }
  };

  const updateClient = async (id, clientData) => {
    try {
      const payload = {};
      if (clientData.name !== undefined) payload.name = clientData.name;
      // Use `contact` (actual DB column, not contact_person)
      if (clientData.contact !== undefined || clientData.contact_person !== undefined) {
        payload.contact = clientData.contact || clientData.contact_person;
      }
      if (clientData.phone !== undefined) payload.phone = clientData.phone;
      if (clientData.email !== undefined) payload.email = clientData.email;
      if (clientData.status !== undefined) payload.status = clientData.status;
      if (clientData.notes !== undefined) payload.notes = clientData.notes;
      if (clientData.source !== undefined) payload.source = clientData.source;

      const serviceVal = clientData.service_type ?? clientData.serviceType ?? clientData.service;
      if (serviceVal !== undefined) payload.service_type = serviceVal;

      await clientsAPI.update(id, payload);
      setClients(prev =>
        prev.map(client =>
          client.id === id ? {
            ...client,
            ...payload,
            updated_at: new Date().toISOString(),
          } : client
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Error updating client:', err?.appError?.userMessage || err?.message);
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