'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ThemeToggle } from '@/components/theme-toggle'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [totalBalance, setTotalBalance] = useState(0)
  const [monthlySpending, setMonthlySpending] = useState(0)
  const [savingsTarget, setSavingsTarget] = useState(0)
  const [savingsProgress, setSavingsProgress] = useState(0)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser(session.user)
    await loadDashboardData(session.user.id)
    setLoading(false)
  }

  async function loadDashboardData(userId: string) {

    // 🔹 Load Transactions
    const { data: trx } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    setTransactions(trx || [])

    let balance = 0
    let monthExpense = 0

    const now = new Date()

    trx?.forEach((t: any) => {
      if (t.type === 'income') {
        balance += t.amount
      } else {
        balance -= t.amount

        const d = new Date(t.created_at)
        if (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {
          monthExpense += t.amount
        }
      }
    })

    setTotalBalance(balance)
    setMonthlySpending(monthExpense)

    // 🔹 Load Savings
    const { data: savings } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('user_id', userId)

    let totalTarget = 0
    let totalCurrent = 0

    savings?.forEach((s: any) => {
      totalTarget += s.target_amount
      totalCurrent += s.current_amount
    })

    setSavingsTarget(totalTarget)

    setSavingsProgress(
      totalTarget > 0
        ? Math.round((totalCurrent / totalTarget) * 100)
        : 0
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p>Welcome back, {user?.email}</p>
          </div>

          <div className="flex gap-2">
            <ThemeToggle />
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        <OverviewCards
          totalBalance={totalBalance}
          monthlySpending={monthlySpending}
          savingsTarget={savingsTarget}
          savingsProgress={savingsProgress}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart transactions={transactions} />
          <CategoryBreakdown transactions={transactions} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/transactions" className="p-6 border rounded-lg">
            <div className="flex justify-between">
              <span>Transactions</span>
              <ArrowRight />
            </div>
          </Link>

          <Link href="/savings" className="p-6 border rounded-lg">
            <div className="flex justify-between">
              <span>Savings Goals</span>
              <ArrowRight />
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}