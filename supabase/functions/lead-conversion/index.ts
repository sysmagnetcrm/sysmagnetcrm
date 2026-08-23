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
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lead_id, service_type, notes } = await req.json();

    if (!lead_id) {
      return new Response(JSON.stringify({ error: 'lead_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch lead record
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (lead.status === 'Converted') {
      return new Response(JSON.stringify({ error: 'Lead has already been converted' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        service_type: service_type || lead.service_type || 'General',
        notes: notes || lead.notes,
        status: 'Active',
        created_by: caller.id,
      })
      .select()
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: clientError?.message || 'Failed to create client record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Update lead status
    const { error: updateLeadError } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'Converted',
        converted_at: new Date().toISOString(),
        converted_client_id: client.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead_id);

    if (updateLeadError) {
      // Rollback client creation
      await supabaseAdmin.from('clients').delete().eq('id', client.id);
      return new Response(JSON.stringify({ error: updateLeadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Write activity & audit log
    await supabaseAdmin.from('activities').insert({
      user_id: caller.id,
      activity_type: 'lead_conversion',
      title: `Converted Lead: ${lead.name}`,
      details: `Lead ${lead.id} converted into Client ${client.id}`,
    });

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: caller.id,
      action: 'LEAD_CONVERTED',
      entity_type: 'leads',
      entity_id: lead_id,
      old_values: { status: lead.status },
      new_values: { status: 'Converted', client_id: client.id },
    });

    return new Response(JSON.stringify({ success: true, client }), {
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
