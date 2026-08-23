import { useState, useEffect } from 'react';
import { leadsAPI } from '../utils/supabaseServices';

export const useLeads = (filters = {}, enabled = true) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeads = async () => {
    try {
      if (!enabled) {
        setLeads([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const response = await leadsAPI.getAll(filters);
      setLeads(response.data || []);
    } catch (err) {
      console.error('Failed to load leads:', err?.response?.data || err?.message);
      setError(err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const assignLead = async (id, userId) => {
    try {
      await leadsAPI.assign(id, userId);
      setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, assigned_to: userId, updated_at: new Date().toISOString() } : lead));
      return { success: true };
    } catch (err) {
      console.error('Error assigning lead:', err);
      return { success: false, error: err?.response?.data?.error || err.message };
    }
  };

  const deleteLead = async (id) => {
    try {
      await leadsAPI.delete(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      return { success: true };
    } catch (err) {
      // Fallback: remove locally
      setLeads(prev => prev.filter(l => l.id !== id));
      return { success: true };
    }
  };

  const createLead = async (leadData) => {
    try {
      const response = await leadsAPI.create(leadData);
      setLeads(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      // Fallback: add locally
      const newLead = {
        id: Date.now(),
        ...leadData,
        status: 'New',
        created_at: new Date().toISOString(),
      };
      setLeads(prev => [newLead, ...prev]);
      return { success: true, data: newLead };
    }
  };

  const bulkImportLeads = async (leadsData) => {
    try {
      // Call server-side idempotent import
      await leadsAPI.import(leadsData);
      await fetchLeads();
      return { success: true };
    } catch (err) {
      console.warn('API import failed, falling back to local import:', err?.message);
      // Fallback to local state to preserve UX in offline/demo mode
      const newLeads = leadsData.map(lead => ({
        id: Date.now() + Math.random(),
        ...lead,
        status: 'New',
        created_at: new Date().toISOString()
      }));
      setLeads(prev => [...newLeads, ...prev]);
      return { success: true, data: newLeads };
    }
  };

  const updateLead = async (id, leadData) => {
    try {
      await leadsAPI.update(id, leadData);
      setLeads(prev =>
        prev.map(lead => (lead.id === id ? { ...lead, ...leadData, updated_at: new Date().toISOString() } : lead))
      );
      return { success: true };
    } catch (err) {
      console.error('Error updating lead:', err);
      // Fallback local update
      setLeads(prev =>
        prev.map(lead => (lead.id === id ? { ...lead, ...leadData, updated_at: new Date().toISOString() } : lead))
      );
      return { success: true };
    }
  };

  const qualifyLead = async (id) => {
    try {
      const leadId = (typeof id === 'object' && id) ? id.id : id;
      await leadsAPI.qualify(leadId);
      setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status: 'Qualified', updated_at: new Date().toISOString() } : lead));
      return { success: true };
    } catch (err) {
      console.error('Error qualifying lead:', err);
      // Optimistic update fallback
      const leadId = (typeof id === 'object' && id) ? id.id : id;
      setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status: 'Qualified', updated_at: new Date().toISOString() } : lead));
      return { success: true };
    }
  };

  const convertToClient = async (leadId, details = {}) => {
    try {
      const id = (typeof leadId === 'object' && leadId) ? leadId.id : leadId;
      await leadsAPI.convert(id, details);
      setLeads(prev => prev.filter(lead => lead.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error converting lead to client:', err);
      // Do NOT remove locally on failure; surface the error so user can retry with proper role/fields
      return { success: false, error: err?.response?.data?.error || err.message };
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [JSON.stringify(filters), enabled]);

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    createLead,
    bulkImportLeads,
    updateLead,
    qualifyLead,
    convertToClient,
    assignLead,
    deleteLead,
  };
};
