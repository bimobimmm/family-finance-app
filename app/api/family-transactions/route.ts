import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || null
}

async function requireFamilyMember(req: Request, familyId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anon || !serviceRole) {
    return { error: NextResponse.json({ error: 'Supabase env is missing' }, { status: 500 }) }
  }

  const token = getTokenFromRequest(req)
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const anonClient = createClient(url, anon)
  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser(token)

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: member, error: memberError } = await anonClient
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('family_id', familyId)
    .maybeSingle()

  if (memberError) {
    return { error: NextResponse.json({ error: memberError.message }, { status: 400 }) }
  }

  if (!member) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const adminClient = createClient(url, serviceRole)
  return { adminClient, user }
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null)
  const id = body?.id
  const familyId = body?.familyId
  const updates = body?.updates

  if (!id || !familyId || !updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const auth = await requireFamilyMember(req, familyId)
  if ('error' in auth) return auth.error

  const safeUpdates = { ...updates }
  delete safeUpdates.id
  delete safeUpdates.family_id
  delete safeUpdates.scope
  delete safeUpdates.user_id
  delete safeUpdates.created_by
  delete safeUpdates.created_at

  const { data, error } = await auth.adminClient
    .from('transactions')
    .update(safeUpdates)
    .eq('id', id)
    .eq('scope', 'family')
    .eq('family_id', familyId)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, row: data })
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null)
  const id = body?.id
  const familyId = body?.familyId

  if (!id || !familyId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const auth = await requireFamilyMember(req, familyId)
  if ('error' in auth) return auth.error

  const { error } = await auth.adminClient
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('scope', 'family')
    .eq('family_id', familyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

