'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ThemeToggle } from '@/components/theme-toggle'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { ArrowRight, Plus } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [totalBalance, setTotalBalance] = useState(0)
  const [monthlySpending, setMonthlySpending] = useState(0)
  const [savingsTarget, setSavingsTarget] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
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

    init()
  }, [])

  async function loadDashboardData(userId: string) {
    // 🔹 Load transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    let balance = 0
    let monthExpense = 0

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    transactions?.forEach((t: any) => {
      if (t.type === 'income') {
        balance += t.amount
      } else {
        balance -= t.amount

        const date = new Date(t.created_at)
        if (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        ) {
          monthExpense += t.amount
        }
      }
    })

    setTotalBalance(balance)
    setMonthlySpending(monthExpense)

    // 🔹 Load savings
    const { data: savings } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('user_id', userId)

    let totalTarget = 0
    savings?.forEach((s: any) => {
      totalTarget += s.target_amount
    })

    setSavingsTarget(totalTarget)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>

          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <OverviewCards
          totalBalance={totalBalance}
          monthlySpending={monthlySpending}
          savingsTarget={savingsTarget}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/transactions" className="p-6 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Manage income & expenses
                </p>
              </div>
              <ArrowRight />
            </div>
          </Link>

          <Link href="/savings" className="p-6 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Savings Goals</h3>
                <p className="text-sm text-muted-foreground">
                  Track your savings
                </p>
              </div>
              <ArrowRight />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}