import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_TABLES = [
  'transactions',
  'savings_targets',
  'families',
  'family_members',
] as const

type AllowedTable = (typeof ALLOWED_TABLES)[number]

function getAdminEmails() {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    ''

  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || null
}

async function requireAdmin(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anon) {
    return { error: NextResponse.json({ error: 'Supabase env is missing' }, { status: 500 }) }
  }

  if (!serviceRole) {
    return { error: NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 }) }
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

  const admins = getAdminEmails()
  const userEmail = user.email?.toLowerCase() || ''

  if (admins.length === 0) {
    return { error: NextResponse.json({ error: 'Admin list is not configured' }, { status: 403 }) }
  }

  if (!admins.includes(userEmail)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const adminClient = createClient(url, serviceRole)
  return { adminClient, user }
}

function parseTable(input: string | null): AllowedTable | null {
  if (!input) return null
  if (!ALLOWED_TABLES.includes(input as AllowedTable)) return null
  return input as AllowedTable
}

async function loadTableRows(adminClient: any, table: AllowedTable) {
  let query = adminClient
    .from(table)
    .select('*')
    .limit(100)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (!error) {
    return { data: data || [] }
  }

  const fallback = await adminClient
    .from(table)
    .select('*')
    .limit(100)

  if (fallback.error) {
    return { error: fallback.error.message }
  }

  return { data: fallback.data || [] }
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { adminClient } = auth
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') || 'overview'

  if (mode === 'table') {
    const table = parseTable(searchParams.get('table'))

    if (!table) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    const result = await loadTableRows(adminClient, table)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      table,
      rows: result.data,
    })
  }

  const [
    transactionsCountRes,
    savingsCountRes,
    familiesCountRes,
    membersCountRes,
    transactionsRes,
    savingsRes,
    usersRes,
  ] = await Promise.all([
    adminClient.from('transactions').select('*', { count: 'exact', head: true }),
    adminClient.from('savings_targets').select('*', { count: 'exact', head: true }),
    adminClient.from('families').select('*', { count: 'exact', head: true }),
    adminClient.from('family_members').select('*', { count: 'exact', head: true }),
    adminClient.from('transactions').select('*').order('created_at', { ascending: false }).limit(200),
    adminClient.from('savings_targets').select('*').order('created_at', { ascending: false }).limit(200),
    adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    }),
  ])

  if (
    transactionsRes.error ||
    savingsRes.error ||
    transactionsCountRes.error ||
    savingsCountRes.error ||
    familiesCountRes.error ||
    membersCountRes.error ||
    usersRes.error
  ) {
    return NextResponse.json(
      {
        error:
          transactionsRes.error?.message ||
          savingsRes.error?.message ||
          transactionsCountRes.error?.message ||
          savingsCountRes.error?.message ||
          familiesCountRes.error?.message ||
          membersCountRes.error?.message ||
          usersRes.error?.message ||
          'Failed to load admin data',
      },
      { status: 400 },
    )
  }

  const allTransactions = transactionsRes.data || []
  const allSavings = savingsRes.data || []
  const registeredUsers =
    usersRes.data?.users?.map((user: any) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    })) || []

  let totalIncome = 0
  let totalExpense = 0
  allTransactions.forEach((row: any) => {
    const amount = Number(row.amount || 0)
    if (row.type === 'income') totalIncome += amount
    if (row.type === 'expense') totalExpense += amount
  })

  let totalTarget = 0
  let totalCurrent = 0
  allSavings.forEach((row: any) => {
    totalTarget += Number(row.target_amount || 0)
    totalCurrent += Number(row.current_amount || 0)
  })

  return NextResponse.json({
    stats: {
      transactions: transactionsCountRes.count || 0,
      savingsTargets: savingsCountRes.count || 0,
      families: familiesCountRes.count || 0,
      familyMembers: membersCountRes.count || 0,
      registeredUsers: registeredUsers.length,
      totalIncome,
      totalExpense,
      totalSavingsTarget: totalTarget,
      totalSavingsCurrent: totalCurrent,
    },
    registeredUsers,
    recentTransactions: allTransactions.slice(0, 10),
    recentSavingsTargets: allSavings.slice(0, 10),
    tables: ALLOWED_TABLES,
  })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { adminClient } = auth
  const body = await req.json().catch(() => null)

  const table = parseTable(body?.table || null)
  const id = body?.id

  if (!table || !id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error } = await adminClient
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { adminClient } = auth
  const body = await req.json().catch(() => null)

  const table = parseTable(body?.table || null)
  const id = body?.id
  const updates = body?.updates

  if (!table || !id || !updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const safeUpdates = { ...updates }
  delete safeUpdates.id

  const { data, error } = await adminClient
    .from(table)
    .update(safeUpdates)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, row: data })
}
