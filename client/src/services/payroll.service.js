import { supabase } from '../utils/supabaseClient';

const wrap = async (promise) => {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return { data };
};

export const payrollService = {
  getCycles: () => wrap(supabase.from('payroll_cycles').select('*').order('created_at', { ascending: false })),
  getRecords: (cycleId) => wrap(supabase.from('payroll_records').select('*, employees(*)').eq('cycle_id', cycleId)),
  
  // Real persistence via Supabase Edge Function
  processPayroll: async (title, startDate, endDate) => {
    const { data, error } = await supabase.functions.invoke('payroll-processing', {
      body: { title, start_date: startDate, end_date: endDate },
    });
    if (error) throw new Error(error.message || 'Payroll processing failed');
    if (data?.error) throw new Error(data.error);
    return { data };
  },
};

export default payrollService;
