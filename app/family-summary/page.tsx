'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

function toMonthRange(month: string) {
  const [year, mm] = month.split('-').map(Number)
  const start = new Date(year, mm - 1, 1)
  const end = new Date(year, mm, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function nowMonthValue() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function FamilySummaryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(nowMonthValue())

  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [transactionsCount, setTransactionsCount] = useState(0)
  const [savingsTargetAdded, setSavingsTargetAdded] = useState(0)
  const [savingsCreatedCount, setSavingsCreatedCount] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)

  const net = useMemo(() => income - expense, [income, expense])

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (familyId) {
      loadReport(familyId, month)
    }
  }, [month, familyId])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data: member } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!member) {
      router.push('/family-hub')
      return
    }

    setFamilyId(member.family_id)
    await loadReport(member.family_id, month)
    setLoading(false)
  }

  async function loadReport(fid: string, selectedMonth: string) {
    const { start, end } = toMonthRange(selectedMonth)

    const { data: trx } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_id', fid)
      .eq('scope', 'family')
      .gte('created_at', start)
      .lt('created_at', end)

    let totalIncome = 0
    let totalExpense = 0
    ;(trx || []).forEach((row: any) => {
      const amount = Number(row.amount || 0)
      if (row.type === 'income') totalIncome += amount
      if (row.type === 'expense') totalExpense += amount
    })

    setIncome(totalIncome)
    setExpense(totalExpense)
    setTransactionsCount((trx || []).length)

    const { data: savings } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('family_id', fid)
      .eq('scope', 'family')
      .gte('created_at', start)
      .lt('created_at', end)

    let totalTargetAdded = 0
    ;(savings || []).forEach((row: any) => {
      totalTargetAdded += Number(row.target_amount || 0)
    })

    setSavingsTargetAdded(totalTargetAdded)
    setSavingsCreatedCount((savings || []).length)

    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('scope', 'family')
      .eq('family_id', fid)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
      .limit(100)

    if (logsError) {
      setHistory([])
      setHistoryError(logsError.message)
    } else {
      setHistory(logs || [])
      setHistoryError(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/family-hub">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Family Summary</h1>
            <p>Monthly family financial report</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Month</span>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Income</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">Rp {income.toLocaleString('id-ID')}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Expense</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">Rp {expense.toLocaleString('id-ID')}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Net</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">Rp {net.toLocaleString('id-ID')}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Transactions</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{transactionsCount}</CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">New Savings Goals</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{savingsCreatedCount}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">New Savings Target</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">Rp {savingsTargetAdded.toLocaleString('id-ID')}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">History Perubahan Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyError && (
              <p className="text-sm text-destructive">
                History belum tersedia: {historyError}
              </p>
            )}

            {history.map((item) => (
              <div key={item.id} className="border rounded-md px-3 py-2 text-sm flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {String(item.action || '').toUpperCase()} {item.entity_type}
                  </p>
                  <p className="text-muted-foreground">{item.note || '-'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            ))}

            {!historyError && history.length === 0 && (
              <p className="text-sm text-muted-foreground">No history in selected month.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
