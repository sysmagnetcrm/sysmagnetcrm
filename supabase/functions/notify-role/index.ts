import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TYPES = ['task', 'lead', 'client', 'payment', 'presence', 'system'];
const ALLOWED_ROLES = ['admin', 'sales', 'digital_marketer', 'developer', 'hr', 'client'];

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
      return new Response(JSON.stringify({ error: 'Invalid token or unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { target_role, type, title, message, data } = await req.json();

    if (!target_role || !type || !title || !message) {
      return new Response(JSON.stringify({ error: 'target_role, type, title, and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_TYPES.includes(type) || !ALLOWED_ROLES.includes(target_role.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Invalid notification type or target role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all users with target role
    const { data: targetUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', target_role.toLowerCase());

    if (usersError || !targetUsers || targetUsers.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notificationRows = targetUsers.map((u: { id: string }) => ({
      recipient_id: u.id,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
      is_read: false,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationRows);

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, count: notificationRows.length }), {
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
