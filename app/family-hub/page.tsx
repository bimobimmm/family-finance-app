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
import { ThemeToggle } from '@/components/theme-toggle'

export default function FamilyHubPage() {

  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])

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

    // 🔹 ambil family id user
    const { data: member } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', session.user.id)
      .single()

    if (!member) {
      setLoading(false)
      return
    }

    setFamilyId(member.family_id)

    await loadFamily(member.family_id)

    setLoading(false)
  }

  async function loadFamily(familyId: string) {

    // 🔹 load family members
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)

    setMembers(familyMembers || [])

    // 🔹 load transactions
    const { data: trx } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_id', familyId)
      .eq('scope', 'family')

    setTransactions(trx || [])

    let balance = 0
    let monthExpense = 0
    const now = new Date()

    trx?.forEach((t: any) => {

      if (t.type === 'income') balance += t.amount
      else balance -= t.amount

      if (t.type === 'expense') {
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

    // 🔹 load savings
    const { data: savings } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('family_id', familyId)
      .eq('scope', 'family')

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!familyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No family found. Create or join one first.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Family Hub</h1>
            <p className="text-muted-foreground mt-1">
              Shared Family Finance
            </p>
          </div>

          <Link href="/family-settings">
  <Button variant="outline">
    Family Settings
  </Button>
</Link>

          <div className="flex items-center gap-4">
            {/* FAMILY MEMBERS AVATAR */}
            <div className="flex -space-x-2">
              {members.map((m, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs border border-background"
                >
                  {m.user_id.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>

            <ThemeToggle />

            <Link href="/dashboard">
              <Button variant="outline">
                Personal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

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

          <Link href="/family-transactions">
            <div className="p-6 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold text-lg mb-1">
                Family Transactions
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage shared transactions
              </p>
            </div>
          </Link>

          <Link href="/family-savings">
            <div className="p-6 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold text-lg mb-1">
                Family Savings
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage shared savings goals
              </p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  )
}