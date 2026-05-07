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

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      throw new Error('Only admins or managers can manage users')
    }

    // Use service role to create auth user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const {
      action = 'create_user',
      employee_code,
      email,
      full_name,
      role,
      manager_ids = [],
      sub_area_ids = [],
      mr_id,
      transfer_to_mr_id,
    } = body

    if (action === 'delete_mr') {
      if (!mr_id) throw new Error('mr_id is required')

      const { data: targetMr, error: targetErr } = await supabaseAdmin
        .from('users')
        .select('id, role, auth_user_id')
        .eq('id', mr_id)
        .maybeSingle()
      if (targetErr) throw targetErr
      if (!targetMr || targetMr.role !== 'mr') throw new Error('Target user is not an MR')

      if (profile.role === 'manager') {
        const { data: mapping, error: mapErr } = await supabaseAdmin
          .from('mr_manager_map')
          .select('id')
          .eq('mr_id', mr_id)
          .eq('manager_id', profile.id)
          .maybeSingle()
        if (mapErr) throw mapErr
        if (!mapping) throw new Error('Manager can delete only mapped MRs')
      }

      if (transfer_to_mr_id) {
        const { data: srcAccess, error: srcErr } = await supabaseAdmin
          .from('mr_sub_area_access')
          .select('sub_area_id')
          .eq('mr_id', mr_id)
        if (srcErr) throw srcErr
        const subAreas = (srcAccess ?? []).map((r) => r.sub_area_id)
        if (subAreas.length > 0) {
          const { error: insertErr } = await supabaseAdmin
            .from('mr_sub_area_access')
            .upsert(
              subAreas.map((sub_area_id) => ({
                mr_id: transfer_to_mr_id,
                sub_area_id,
              })),
              { onConflict: 'mr_id,sub_area_id' },
            )
          if (insertErr) throw insertErr
        }
      }

      const { error: delSubErr } = await supabaseAdmin
        .from('mr_sub_area_access')
        .delete()
        .eq('mr_id', mr_id)
      if (delSubErr) throw delSubErr

      const { error: delMapErr } = await supabaseAdmin
        .from('mr_manager_map')
        .delete()
        .eq('mr_id', mr_id)
      if (delMapErr) throw delMapErr

      const { error: deactErr } = await supabaseAdmin
        .from('users')
        .update({
          is_active: false,
          auth_user_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mr_id)
      if (deactErr) throw deactErr

      if (targetMr.auth_user_id) {
        const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(targetMr.auth_user_id)
        if (delAuthErr) throw delAuthErr
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!employee_code || !email || !full_name || !role) {
      throw new Error('employee_code, email, full_name, role are required')
    }
    if (profile.role === 'manager' && role !== 'mr') {
      throw new Error('Managers can create only MR accounts')
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: 'Maktree@123',
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { full_name, employee_code }
    })

    if (authError) throw authError

    // Create / update public.users row
    const { data: existingUser, error: exErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('employee_code', employee_code)
      .maybeSingle()
    if (exErr) throw exErr

    let userId = existingUser?.id as string | undefined

    if (userId) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          auth_user_id: authUser.user.id,
          email: normalizedEmail,
          full_name,
          role,
          is_active: true,
        })
        .eq('id', userId)
      if (updateError) throw updateError
    } else {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('users')
        .insert({
          employee_code: employee_code.trim(),
          full_name: full_name.trim(),
          email: normalizedEmail,
          role,
          is_active: true,
          auth_user_id: authUser.user.id,
        })
        .select('id')
        .single()
      if (insertErr) throw insertErr
      userId = inserted.id
    }

    if (role === 'mr' && userId) {
      const managerIds = Array.isArray(manager_ids) ? manager_ids : []
      const subAreaIds = Array.isArray(sub_area_ids) ? sub_area_ids : []
      const effectiveManagerIds = profile.role === 'manager' ? [profile.id] : managerIds

      if (effectiveManagerIds.length > 0) {
        const { error: mmErr } = await supabaseAdmin
          .from('mr_manager_map')
          .upsert(
            effectiveManagerIds.map((manager_id: string) => ({ mr_id: userId, manager_id })),
            { onConflict: 'mr_id,manager_id' },
          )
        if (mmErr) throw mmErr
      }

      if (subAreaIds.length > 0) {
        const { error: saErr } = await supabaseAdmin
          .from('mr_sub_area_access')
          .upsert(
            subAreaIds.map((sub_area_id: string) => ({ mr_id: userId, sub_area_id })),
            { onConflict: 'mr_id,sub_area_id' },
          )
        if (saErr) throw saErr
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ auth_user_id: authUser.user.id, email: normalizedEmail })
      .eq('employee_code', employee_code)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ auth_user_id: authUser.user.id, user_id: userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
