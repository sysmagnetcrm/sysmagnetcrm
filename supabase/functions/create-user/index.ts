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

    // Service role client to perform admin actions
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller's identity via JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token or unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller has 'admin' role in public.users or auth metadata
    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();

    const roleFromProfile = callerProfile?.role;
    const roleFromMetadata = caller.user_metadata?.role || caller.app_metadata?.role;
    const effectiveRole = (roleFromProfile || roleFromMetadata || 'admin').toLowerCase();

    const isAdmin = effectiveRole === 'admin' || (caller.user_metadata?.role || '').toLowerCase() === 'admin';

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Self-heal: Ensure caller has a profile row in public.users if missing
    if (!callerProfile) {
      await supabaseAdmin.from('users').upsert({
        id: caller.id,
        email: caller.email,
        name: caller.user_metadata?.name || caller.email?.split('@')[0] || 'Admin User',
        role: 'admin',
        is_active: true,
      });
    }

    // Parse payload
    const { email, password, name, role = 'client', employee_id, department, position } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanRole = role ? role.toLowerCase() : 'client';

    // 1. Create Auth user
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: cleanRole },
    });

    if (createAuthError) {
      return new Response(JSON.stringify({ error: createAuthError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUser = authData.user;

    // 2. Upsert profile in public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: newUser.id,
        email,
        name,
        role: cleanRole,
        is_active: true,
      })
      .select('*')
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create employee row for staff roles if applicable
    if (['admin', 'sales', 'digital_marketer', 'developer', 'hr', 'employee', 'finance'].includes(cleanRole)) {
      await supabaseAdmin.from('employees').upsert({
        user_id: newUser.id,
        name,
        email,
        employee_id: employee_id || `EMP-${Date.now().toString().slice(-4)}`,
        department: department || 'General',
        position: position || cleanRole,
        status: 'active',
      }, { onConflict: 'email', ignoreDuplicates: true });
    }

    return new Response(JSON.stringify({ user: profile }), {
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
