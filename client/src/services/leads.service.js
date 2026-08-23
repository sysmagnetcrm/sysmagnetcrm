import { supabase } from '../utils/supabaseClient';
import { sanitizeSearchTerm } from '../utils/sanitize';

const wrap = async (promise) => {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return { data };
};

export const leadsService = {
  getAll: async (params = {}) => {
    let query = supabase.from('leads').select('*');
    if (params.search) {
      const cleanTerm = sanitizeSearchTerm(params.search);
      if (cleanTerm) {
        query = query.or(`name.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%,phone.ilike.%${cleanTerm}%,company.ilike.%${cleanTerm}%`);
      }
    }
    if (params.status && params.status !== 'All') {
      query = query.eq('status', params.status);
    }
    if (params.priority && params.priority !== 'All') {
      query = query.eq('priority', params.priority);
    }
    query = query.order('created_at', { ascending: false });
    return wrap(query);
  },

  getOne: (id) => wrap(supabase.from('leads').select('*').eq('id', id).single()),
  create: (data) => wrap(supabase.from('leads').insert(data).select().single()),
  update: (id, data) => wrap(supabase.from('leads').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('leads').delete().eq('id', id)),

  // Transactional lead conversion via Supabase Edge Function
  convertLead: async (leadId, serviceType, notes) => {
    const { data, error } = await supabase.functions.invoke('lead-conversion', {
      body: { lead_id: leadId, service_type: serviceType, notes },
    });
    if (error) throw new Error(error.message || 'Lead conversion failed');
    if (data?.error) throw new Error(data.error);
    return { data: data.client };
  },
};

export default leadsService;
