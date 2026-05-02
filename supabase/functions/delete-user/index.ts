import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: caller.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      console.error('Unauthorized access attempt by:', caller.id);
      return new Response(
        JSON.stringify({ error: 'No autorizado: Solo administradores pueden eliminar usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user_id to delete from request body
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(
        JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info before deletion for logging
    const { data: userData } = await supabase
      .from('app_user')
      .select('email, first_name, last_name')
      .eq('auth_user_id', user_id)
      .single();

    console.log('Deleting user:', {
      user_id,
      email: userData?.email,
      deleted_by: caller.email,
      timestamp: new Date().toISOString()
    });

    // Delete user from auth.users (this will cascade to app_user and user_roles)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Error al eliminar usuario: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuario ${userData?.email || user_id} eliminado exitosamente`,
        deleted_user: {
          id: user_id,
          email: userData?.email,
          name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
