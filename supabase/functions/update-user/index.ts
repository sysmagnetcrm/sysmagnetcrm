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
      return new Response(JSON.stringify({ error: 'Invalid token or unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    if (!callerProfile) {
      await supabaseAdmin.from('users').upsert({
        id: caller.id,
        email: caller.email,
        name: caller.user_metadata?.name || caller.email?.split('@')[0] || 'Admin User',
        role: 'admin',
        is_active: true,
      });
    }

    const { id, name, role, email, password, status, is_active } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Update Supabase Auth if email, password or metadata changed
    const authUpdates: Record<string, any> = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;
    if (name || role) {
      authUpdates.user_metadata = {};
      if (name) authUpdates.user_metadata.name = name;
      if (role) authUpdates.user_metadata.role = role.toLowerCase();
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
      if (authUpdateError) {
        return new Response(JSON.stringify({ error: authUpdateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Update profile row in public.users
    const profilePatch: Record<string, any> = {};
    if (name !== undefined) profilePatch.name = name;
    if (email !== undefined) profilePatch.email = email;
    if (role !== undefined) profilePatch.role = role.toLowerCase();
    if (is_active !== undefined) profilePatch.is_active = is_active;
    if (status !== undefined) profilePatch.status = status;

    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .update(profilePatch)
      .eq('id', id)
      .select('*')
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ user: updatedProfile }), {
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
