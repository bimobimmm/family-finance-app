'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, HeartPulse, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'

type Scope = 'personal' | 'family'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function FinancialHealthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<Scope>('personal')
  const [userId, setUserId] = useState<string | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)

  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyExpense, setMonthlyExpense] = useState(0)
  const [savingTarget, setSavingTarget] = useState(0)
  const [savingCurrent, setSavingCurrent] = useState(0)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (userId) {
      loadHealth(scope, userId, familyId)
    }
  }, [scope, userId, familyId])

  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUserId(session.user.id)

    const { data: member } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (member?.family_id) {
      setFamilyId(member.family_id)
    }

    await loadHealth('personal', session.user.id, member?.family_id || null)
    setLoading(false)
  }

  async function loadHealth(currentScope: Scope, uid: string, fid: string | null) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    let trxQuery = supabase.from('transactions').select('*').gte('created_at', monthStart)
    if (currentScope === 'family' && fid) {
      trxQuery = trxQuery.eq('scope', 'family').eq('family_id', fid)
    } else {
      trxQuery = trxQuery.eq('scope', 'personal').eq('user_id', uid)
    }

    const { data: trx } = await trxQuery
    let income = 0
    let expense = 0
    ;(trx || []).forEach((row: any) => {
      const amount = Number(row.amount || 0)
      if (row.type === 'income') income += amount
      if (row.type === 'expense') expense += amount
    })

    setMonthlyIncome(income)
    setMonthlyExpense(expense)

    let savingsQuery = supabase.from('savings_targets').select('*')
    if (currentScope === 'family' && fid) {
      savingsQuery = savingsQuery.eq('scope', 'family').eq('family_id', fid)
    } else {
      savingsQuery = savingsQuery.eq('scope', 'personal').eq('user_id', uid)
    }

    const { data: savings } = await savingsQuery
    let target = 0
    let current = 0
    ;(savings || []).forEach((row: any) => {
      target += Number(row.target_amount || 0)
      current += Number(row.current_amount || 0)
    })

    setSavingTarget(target)
    setSavingCurrent(current)
  }

  const metrics = useMemo(() => {
    const savingRatio = savingTarget > 0 ? clamp((savingCurrent / savingTarget) * 100, 0, 100) : 0
    const expenseRatio = monthlyIncome > 0 ? clamp((monthlyExpense / monthlyIncome) * 100, 0, 200) : 100
    const netCashflow = monthlyIncome - monthlyExpense

    const savingScore = savingRatio
    const spendingScore = clamp(100 - expenseRatio, 0, 100)
    const cashflowScore = netCashflow >= 0 ? 100 : clamp(100 - (Math.abs(netCashflow) / Math.max(monthlyIncome, 1)) * 100, 0, 100)

    const healthScore = Math.round(savingScore * 0.45 + spendingScore * 0.35 + cashflowScore * 0.2)

    let level = 'Good'
    if (healthScore >= 85) level = 'Excellent'
    else if (healthScore >= 70) level = 'Good'
    else if (healthScore >= 50) level = 'Warning'
    else level = 'Critical'

    const insights: string[] = []
    insights.push(`Saving progress: ${Math.round(savingRatio)}% dari target.`)
    insights.push(`Expense ratio: ${Math.round(expenseRatio)}% dari income bulan ini.`)
    insights.push(`Net cashflow bulan ini: Rp ${netCashflow.toLocaleString('id-ID')}.`)

    const actions: string[] = []
    if (expenseRatio > 80) actions.push('Kurangi pengeluaran tidak wajib minimal 10% bulan depan.')
    if (savingRatio < 50) actions.push('Naikkan setoran tabungan rutin untuk percepat target.')
    if (netCashflow < 0) actions.push('Pastikan pemasukan lebih besar dari pengeluaran bulan berikutnya.')
    if (actions.length === 0) actions.push('Pertahankan pola saat ini, kondisi keuangan sudah stabil.')

    return { savingRatio, expenseRatio, netCashflow, healthScore, level, insights, actions }
  }, [monthlyIncome, monthlyExpense, savingTarget, savingCurrent])

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
          <Link href={scope === 'family' ? '/family-hub' : '/dashboard'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <HeartPulse className="h-6 w-6" />
              Financial Health
            </h1>
            <p className="text-sm text-muted-foreground">Skor kesehatan keuangan personal/family</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-2">
          <Button variant={scope === 'personal' ? 'default' : 'outline'} onClick={() => setScope('personal')}>
            Personal
          </Button>
          {familyId && (
            <Button variant={scope === 'family' ? 'default' : 'outline'} onClick={() => setScope('family')}>
              Family
            </Button>
          )}
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Health Score: {metrics.healthScore}/100</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  metrics.level === 'Excellent'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : metrics.level === 'Good'
                    ? 'bg-blue-500/15 text-blue-400'
                    : metrics.level === 'Warning'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-red-500/15 text-red-400'
                }`}
              >
                {metrics.level}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={metrics.healthScore} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Skor dihitung dari saving progress, expense ratio, dan net cashflow bulan berjalan.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Saving Progress</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{Math.round(metrics.savingRatio)}%</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Expense Ratio</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{Math.round(metrics.expenseRatio)}%</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Net Cashflow</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">Rp {metrics.netCashflow.toLocaleString('id-ID')}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.insights.map((item) => (
              <div key={item} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.actions.map((item) => (
              <div key={item} className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
