'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { TransactionNotesCard } from '@/components/dashboard/transaction-notes-card'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardPage() {

  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [totalBalance, setTotalBalance] = useState(0)
  const [monthlySpending, setMonthlySpending] = useState(0)
  const [savingsTarget, setSavingsTarget] = useState(0)
  const [savingsCurrent, setSavingsCurrent] = useState(0)
  const [savingsProgress, setSavingsProgress] = useState(0)
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const isAdmin = adminEmails.includes((user?.email || '').toLowerCase())

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
    await loadPersonal(session.user.id)
    setLoading(false)
  }

  async function loadPersonal(userId: string) {

    // 🔹 TRANSACTIONS
    const { data: trx } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('scope', 'personal')

    setTransactions(trx || [])

    let balance = 0
    let monthExpense = 0
    const now = new Date()

    trx?.forEach((t: any) => {
      const d = new Date(t.created_at)
      const isCurrentMonth =
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()

      if (t.type === 'income') {
        balance += t.amount
      } else {
        balance -= t.amount

        if (isCurrentMonth) {
          monthExpense += t.amount
        }
      }
    })

    setTotalBalance(balance)
    setMonthlySpending(monthExpense)

    // 🔹 SAVINGS
    const { data: savings } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('scope', 'personal')

    let totalTarget = 0
    let totalCurrent = 0

    savings?.forEach((s: any) => {
      totalTarget += s.target_amount
      totalCurrent += s.current_amount
    })

    setSavingsTarget(totalTarget)
    setSavingsCurrent(totalCurrent)

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

      {/* HEADER */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">
              Save Your Money!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">
              Welcome back, {user?.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <ThemeToggle />

            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline">
                  Admin
                </Button>
              </Link>
            )}

            <Link href="/profile">
              <Button variant="outline">
                Profile
              </Button>
            </Link>

            <Link href="/family-hub">
              <Button variant="outline">
                Family Hub
              </Button>
            </Link>

            <Button onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* OVERVIEW CARDS */}
        <OverviewCards
          totalBalance={totalBalance}
          monthlySpending={monthlySpending}
          savingsTarget={savingsTarget}
          savingsCurrent={savingsCurrent}
          savingsProgress={savingsProgress}
        />

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart transactions={transactions} />
          <CategoryBreakdown transactions={transactions} />
        </div>

        <TransactionNotesCard
          transactions={transactions}
          title="Catatan Pemasukan & Pengeluaran"
        />

        {/* QUICK ACTION CARDS (RESTORED) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <Link href="/transactions">
            <div className="p-6 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold text-lg mb-1">
                Transactions
              </h3>
              <p className="text-sm text-muted-foreground">
                Add, edit and manage your personal transactions
              </p>
            </div>
          </Link>

          <Link href="/savings">
            <div className="p-6 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold text-lg mb-1">
                Savings Goals
              </h3>
              <p className="text-sm text-muted-foreground">
                Create and manage your savings targets
              </p>
            </div>
          </Link>

          <Link href="/summary">
            <div className="p-6 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold text-lg mb-1">
                Summary
              </h3>
              <p className="text-sm text-muted-foreground">
                Monthly report and personal history changes
              </p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  )
}
