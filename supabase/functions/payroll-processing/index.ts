import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, start_date, end_date } = await req.json();

    if (!title || !start_date || !end_date) {
      return new Response(JSON.stringify({ error: 'title, start_date, and end_date are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create payroll cycle
    const { data: cycle, error: cycleError } = await supabaseAdmin
      .from('payroll_cycles')
      .insert({
        title,
        start_date,
        end_date,
        status: 'Processed',
        processed_at: new Date().toISOString(),
        processed_by: caller.id,
      })
      .select()
      .single();

    if (cycleError || !cycle) {
      return new Response(JSON.stringify({ error: cycleError?.message || 'Failed to create payroll cycle' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch all active employees
    const { data: employees } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('status', 'Active');

    const records = (employees || []).map((emp: any) => {
      const basePay = Number(emp.base_salary) || 0;
      const overtimePay = 0;
      const bonuses = 0;
      const deductions = 0;
      const netPay = basePay + overtimePay + bonuses - deductions;

      return {
        cycle_id: cycle.id,
        employee_id: emp.id,
        base_pay: basePay,
        overtime_pay: overtimePay,
        bonuses,
        deductions,
        net_pay: netPay,
        status: 'Approved',
      };
    });

    if (records.length > 0) {
      await supabaseAdmin.from('payroll_records').insert(records);
    }

    // 3. Write audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: caller.id,
      action: 'PAYROLL_PROCESSED',
      entity_type: 'payroll_cycles',
      entity_id: cycle.id,
      new_values: { cycle_title: title, employee_count: records.length },
    });

    return new Response(JSON.stringify({ success: true, cycle, records_count: records.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
