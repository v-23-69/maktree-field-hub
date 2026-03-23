import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is admin via their JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Check caller role
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabaseClient
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Only admins can create users')
    }

    // Use service role to create auth user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { employee_code, email, full_name, role } = body

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'Maktree@123',
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { full_name, employee_code }
    })

    if (authError) throw authError

    // Link auth_user_id back to public.users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ auth_user_id: authUser.user.id, email })
      .eq('employee_code', employee_code)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ id: authUser.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
