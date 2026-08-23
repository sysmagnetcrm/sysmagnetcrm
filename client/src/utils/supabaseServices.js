import { supabase } from './supabaseClient';
import { sanitizeSearchTerm } from './sanitize';
import { normalizeError } from './errorHandler';

// Helper to standardise return format matching axios responses { data: ... }
const wrap = async (promise, context = {}) => {
  try {
    const { data, error } = await promise;
    if (error) {
      const normalized = normalizeError(error, context);
      const errObj = new Error(normalized.userMessage);
      errObj.appError = normalized;
      throw errObj;
    }
    return { data };
  } catch (e) {
    if (e.appError) throw e;
    const normalized = normalizeError(e, context);
    const errObj = new Error(normalized.userMessage);
    errObj.appError = normalized;
    throw errObj;
  }
};

// Helper for invoking Edge Functions
const invokeFunction = async (functionName, body, context = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    if (error || data?.error) {
      const normalized = normalizeError(error || data?.error, { module: 'edge_function', action: functionName, ...context });
      const errObj = new Error(normalized.userMessage);
      errObj.appError = normalized;
      throw errObj;
    }
    return { data };
  } catch (e) {
    if (e.appError) throw e;
    const normalized = normalizeError(e, { module: 'edge_function', action: functionName, ...context });
    const errObj = new Error(normalized.userMessage);
    errObj.appError = normalized;
    throw errObj;
  }
};

// 1. LEADS API
export const leadsAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('leads').select('*');
    if (params.search) {
      const cleanTerm = sanitizeSearchTerm(params.search);
      if (cleanTerm) {
        query = query.or(`name.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%,phone.ilike.%${cleanTerm}%`);
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
  update: (id, data) => wrap(supabase.from('leads').update(data).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('leads').delete().eq('id', id)),
};

// 2. CLIENTS API
export const clientsAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('clients').select('*');
    if (params.search) {
      const cleanTerm = sanitizeSearchTerm(params.search);
      if (cleanTerm) {
        query = query.or(`name.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%,contact.ilike.%${cleanTerm}%`);
      }
    }
    if (params.status && params.status !== 'All') {
      query = query.eq('status', params.status);
    }
    query = query.order('created_at', { ascending: false });
    return wrap(query);
  },
  getOne: (id) => wrap(supabase.from('clients').select('*').eq('id', id).single()),
  create: (data) => wrap(supabase.from('clients').insert(data).select().single()),
  update: (id, data) => wrap(supabase.from('clients').update(data).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('clients').delete().eq('id', id)),
};

// 3. PAYMENTS API
export const paymentsAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('payments').select('*, clients(name)');
    if (params.search) {
      const cleanTerm = sanitizeSearchTerm(params.search);
      if (cleanTerm) {
        query = query.or(`invoice_no.ilike.%${cleanTerm}%`);
      }
    }
    if (params.status && params.status !== 'All') {
      query = query.eq('payment_status', params.status);
    }
    query = query.order('created_at', { ascending: false });
    return wrap(query);
  },
  getOne: (id) => wrap(supabase.from('payments').select('*, clients(name)').eq('id', id).single()),
  create: (data) => wrap(supabase.from('payments').insert(data).select().single()),
  update: (id, data) => wrap(supabase.from('payments').update(data).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('payments').delete().eq('id', id)),
};

// 4. TASKS API
export const tasksAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('tasks').select('*');
    if (params.search) {
      const cleanTerm = sanitizeSearchTerm(params.search);
      if (cleanTerm) {
        query = query.or(`title.ilike.%${cleanTerm}%`);
      }
    }
    if (params.status && params.status !== 'All') {
      query = query.eq('status', params.status);
    }
    query = query.order('created_at', { ascending: false });
    return wrap(query);
  },
  getOne: (id) => wrap(supabase.from('tasks').select('*').eq('id', id).single()),
  create: (data) => wrap(supabase.from('tasks').insert(data).select().single()),
  update: (id, data) => wrap(supabase.from('tasks').update(data).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('tasks').delete().eq('id', id)),
};

// 5. USERS API (Calls Edge Functions for admin actions)
export const usersAPI = {
  getAll: () => wrap(supabase.from('users').select('*').order('created_at', { ascending: false })),
  getOne: (id) => wrap(supabase.from('users').select('*').eq('id', id).single()),
  create: (data) => invokeFunction('create-user', data),
  update: (id, data) => invokeFunction('update-user', { id, ...data }),
  delete: (id) => invokeFunction('delete-user', { id }),
  resetPassword: (id, email) => invokeFunction('reset-password-link', { id, email }),
};

// 6. CANDIDATES API
export const candidatesAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('candidates').select('*');
    if (params.search) {
      const cleanTerm = sanitizeSearchTerm(params.search);
      if (cleanTerm) {
        query = query.or(`name.ilike.%${cleanTerm}%,position.ilike.%${cleanTerm}%`);
      }
    }
    query = query.order('created_at', { ascending: false });
    return wrap(query);
  },
  getOne: (id) => wrap(supabase.from('candidates').select('*').eq('id', id).single()),
  create: (data) => wrap(supabase.from('candidates').insert(data).select().single()),
  update: (id, data) => wrap(supabase.from('candidates').update(data).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('candidates').delete().eq('id', id)),
};

// 7. EMPLOYEES API
export const employeesAPI = {
  getAll: () => wrap(supabase.from('employees').select('*').order('created_at', { ascending: false })),
  getOne: (id) => wrap(supabase.from('employees').select('*').eq('id', id).single()),
  create: (data) => wrap(supabase.from('employees').insert(data).select().single()),
  update: (id, data) => wrap(supabase.from('employees').update(data).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('employees').delete().eq('id', id)),
};

// 8. ATTENDANCE API
export const attendanceAPI = {
  getAll: () => wrap(supabase.from('attendance').select('*, employees(name, position)').order('date', { ascending: false })),
  mark: (data) => wrap(supabase.from('attendance').insert(data).select().single()),
};

// 9. NOTIFICATIONS API
export const notificationsAPI = {
  getAll: () => wrap(supabase.from('notifications').select('*').order('created_at', { ascending: false })),
  markRead: (id) => wrap(supabase.from('notifications').update({ is_read: true }).eq('id', id)),
  markAllRead: () => wrap(supabase.from('notifications').update({ is_read: true }).eq('is_read', false)),
  notifyRole: (payload) => invokeFunction('notify-role', payload),
};

// 10. ACTIVITIES API
export const activitiesAPI = {
  getAll: () => wrap(supabase.from('activities').select('*').order('created_at', { ascending: false })),
  create: (data) => wrap(supabase.from('activities').insert(data)),
};

// 11. REPORTS & DASHBOARD API
export const reportsAPI = {
  getSummary: async () => {
    const [leads, clients, payments, tasks] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('amount'),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
    ]);

    const totalRevenue = (payments.data || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    return {
      data: {
        totalLeads: leads.count || 0,
        totalClients: clients.count || 0,
        totalTasks: tasks.count || 0,
        totalRevenue,
      },
    };
  },
};

export const dashboardAPI = {
  getStats: () => reportsAPI.getSummary(),
};

// 12. CLIENT TASKS & ATTACHMENTS API
const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const clientTasksAPI = {
  getAll: () => wrap(supabase.from('client_tasks').select('*').order('created_at', { ascending: false })),
  getOne: (id) => wrap(supabase.from('client_tasks').select('*').eq('id', id).single()),
  create: (data) => wrap(supabase.from('client_tasks').insert(data).select().single()),
  update: (id, data) => wrap(supabase.from('client_tasks').update(data).eq('id', id).select().single()),
  delete: (id) => wrap(supabase.from('client_tasks').delete().eq('id', id)),
  getLogs: (taskId) => wrap(supabase.from('client_task_logs').select('*').eq('task_id', taskId).order('created_at', { ascending: true })),
  addLog: (taskId, logData) => wrap(supabase.from('client_task_logs').insert({ task_id: taskId, ...logData }).select().single()),
  uploadAttachment: async (taskId, file) => {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error('File size exceeds 20MB limit');
    }
    const path = `task-${taskId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('task-attachments').upload(path, file);
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage.from('task-attachments').getPublicUrl(path);

    const { data: record, error: dbError } = await supabase
      .from('client_attachments')
      .insert({
        task_id: taskId,
        filename: file.name,
        storage_path: publicUrlData.publicUrl,
      })
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);
    return { data: record };
  },
};

export const adminClientTasksAPI = clientTasksAPI;
export const staffClientTasksAPI = clientTasksAPI;

// 13. PRESENCE & PORTAL API
export const presenceAPI = {
  ping: async () => ({ data: { ok: true } }),
  getOnline: async () => wrap(supabase.from('users').select('id, name, email, role')),
};

export const portalAPI = {
  getProfile: () => wrap(supabase.from('users').select('*').single()),
};

// 14. PAYROLL STUB (UI display fallback per Phase 3 item 5)
export const payrollAPI = {
  getAll: async () => ({ data: [] }),
  create: async () => { throw new Error('Payroll module coming soon'); },
  update: async () => { throw new Error('Payroll module coming soon'); },
  delete: async () => { throw new Error('Payroll module coming soon'); },
};

export const salesAPI = {
  getAll: () => leadsAPI.getAll({ status: 'Converted' }),
};

export const featuresAPI = {
  getFeatures: async () => ({ data: { clientTasks: true, payroll: false, recruitment: true } }),
};

export const rolesAPI = {
  getAll: async () => ({ data: ['admin', 'sales', 'digital_marketer', 'developer', 'hr', 'client'] }),
};

export const permissionsAPI = {
  getAll: async () => ({ data: [] }),
};

export const meAPI = {
  getProfile: () => wrap(supabase.from('users').select('*').single()),
  updateProfile: async (data) => wrap(supabase.from('users').update(data).single()),
};

export const ticketsAPI = {
  getTickets: () => wrap(supabase.from('client_tasks').select('*').order('created_at', { ascending: false })),
  createTicket: (data) => wrap(supabase.from('client_tasks').insert(data).select().single()),
  updateTicket: (id, data) => wrap(supabase.from('client_tasks').update(data).eq('id', id).select().single()),
};

export const automationAPI = {
  getRuns: async () => ({ data: { items: [] } }),
};
