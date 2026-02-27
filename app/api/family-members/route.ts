import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || null
}

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anon || !serviceRole) {
    return NextResponse.json({ error: 'Supabase env is missing' }, { status: 500 })
  }

  const token = getTokenFromRequest(req)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const anonClient = createClient(url, anon)
  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Read requester memberships with anon client so RLS stays enforced for this step.
  const { data: myMemberships, error: myMembershipsError } = await anonClient
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)

  if (myMembershipsError) {
    return NextResponse.json({ error: myMembershipsError.message }, { status: 400 })
  }

  const familyIds = (myMemberships || []).map((m: any) => m.family_id).filter(Boolean)
  if (familyIds.length === 0) {
    return NextResponse.json({ members: [] })
  }

  const adminClient = createClient(url, serviceRole)
  const { data: allMembers, error: membersError } = await adminClient
    .from('family_members')
    .select('family_id, user_id, role, created_at')
    .in('family_id', familyIds)

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 400 })
  }

  const uniqueUserIds = Array.from(
    new Set((allMembers || []).map((m: any) => m.user_id).filter(Boolean)),
  )

  const usersRes = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (usersRes.error) {
    return NextResponse.json({ error: usersRes.error.message }, { status: 400 })
  }

  const userById = new Map<string, { email: string | null }>()
  ;(usersRes.data?.users || []).forEach((u: any) => {
    if (uniqueUserIds.includes(u.id)) {
      userById.set(u.id, { email: u.email || null })
    }
  })

  const members = (allMembers || []).map((m: any) => ({
    family_id: m.family_id,
    user_id: m.user_id,
    role: m.role || 'member',
    created_at: m.created_at || null,
    email: userById.get(m.user_id)?.email || null,
  }))

  return NextResponse.json({ members })
}

