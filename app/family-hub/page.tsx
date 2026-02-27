'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { FileText, UserRound, Shield, Home, HeartPulse } from 'lucide-react'
import { parseAppDate } from '@/lib/date'

type Language = 'id' | 'en'
type FamilySection = 'overview' | 'analytics'

const COPY = {
  id: {
    title: 'Family Hub',
    welcome: 'Selamat datang kembali',
    admin: 'Admin',
    logout: 'Logout',
    tabs: {
      overview: 'Ringkasan',
      analytics: 'Analitik',
    },
    overviewLabels: {
      totalBalance: 'Total Balance',
      monthlySpending: 'Pengeluaran Bulanan',
      currentSaving: 'Tabungan Saat Ini',
      savingsTarget: 'Target Tabungan',
      savingWarningTitle: 'Peringatan Saving',
      currentSavingHint: 'Diambil dari input Family Saving Plan',
      completedSuffix: 'tercapai',
    },
    chart: {
      title: 'Pengeluaran Harian',
      totalPeriod: 'Total periode',
      sevenDays: '7 Hari',
      thirtyDays: '30 Hari',
      noData: 'Belum ada data pengeluaran pada periode ini',
    },
    category: {
      title: 'Pengeluaran per Kategori',
      noData: 'Belum ada data kategori',
      total: 'Total',
    },
    notesTitle: 'Catatan Pemasukan & Pengeluaran Family',
    notes: {
      sevenDays: '7 Hari',
      thirtyDays: '30 Hari',
      totalIncome: 'Total Pemasukan',
      totalExpense: 'Total Pengeluaran',
      all: 'Semua',
      income: 'Pemasukan',
      expense: 'Pengeluaran',
      empty: 'Belum ada catatan transaksi untuk filter ini.',
      incomeFallback: 'Pemasukan',
      expenseFallback: 'Pengeluaran',
      userFilterAll: 'Semua User',
      userFilterLabel: 'Filter User',
    },
    actions: {
      report: 'Laporan',
      reportDesc: 'Ringkasan bulanan',
      financialHealth: 'Financial Health',
      financialHealthDesc: 'Skor kesehatan keuangan',
      personal: 'Personal',
      personalDesc: 'Buka dashboard personal',
      profile: 'Profile',
      profileDesc: 'Data akun dan family',
      admin: 'Admin',
      adminDesc: 'Kelola seluruh data',
    },
  },
  en: {
    title: 'Family Hub',
    welcome: 'Welcome back',
    admin: 'Admin',
    logout: 'Logout',
    tabs: {
      overview: 'Overview',
      analytics: 'Analytics',
    },
    overviewLabels: {
      totalBalance: 'Total Balance',
      monthlySpending: 'Monthly Spending',
      currentSaving: 'Current Saving',
      savingsTarget: 'Savings Target',
      savingWarningTitle: 'Saving Warning',
      currentSavingHint: 'Taken from Family Saving Plan input',
      completedSuffix: 'completed',
    },
    chart: {
      title: 'Daily Spending',
      totalPeriod: 'Total period',
      sevenDays: '7 Days',
      thirtyDays: '30 Days',
      noData: 'No expense data in the selected period',
    },
    category: {
      title: 'Spending by Category',
      noData: 'No category data',
      total: 'Total',
    },
    notesTitle: 'Family Income & Expense Notes',
    notes: {
      sevenDays: '7 Days',
      thirtyDays: '30 Days',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expense',
      all: 'All',
      income: 'Income',
      expense: 'Expense',
      empty: 'No transaction notes for this filter.',
      incomeFallback: 'Income',
      expenseFallback: 'Expense',
      userFilterAll: 'All Users',
      userFilterLabel: 'Filter User',
    },
    actions: {
      report: 'Reports',
      reportDesc: 'Monthly summary',
      financialHealth: 'Financial Health',
      financialHealthDesc: 'Finance health score',
      personal: 'Personal',
      personalDesc: 'Open personal dashboard',
      profile: 'Profile',
      profileDesc: 'Account and family data',
      admin: 'Admin',
      adminDesc: 'Manage all data',
    },
  },
}

export default function FamilyHubPage() {
  const router = useRouter()
  const supabase = createClient()

  const [language, setLanguage] = useState<Language>('id')
  const [activeSection, setActiveSection] = useState<FamilySection>('overview')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
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
  const t = COPY[language]

  useEffect(() => {
    const stored = window.localStorage.getItem('app-language') as Language | null
    if (stored === 'id' || stored === 'en') setLanguage(stored)
  }, [])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser(session.user)

    const { data: member } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!member) {
      setLoading(false)
      return
    }

    setFamilyId(member.family_id)
    await loadFamily(member.family_id)
    setLoading(false)
  }

  async function loadFamily(fid: string) {
    const { data: trx } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_id', fid)
      .eq('scope', 'family')

    setTransactions(trx || [])

    let balance = 0
    let monthExpense = 0
    const now = new Date()

    ;(trx || []).forEach((row: any) => {
      const date = parseAppDate(row.created_at)
      const isCurrentMonth =
        date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

      if (row.type === 'income') balance += row.amount
      else {
        balance -= row.amount
        if (isCurrentMonth) monthExpense += row.amount
      }
    })

    setTotalBalance(balance)
    setMonthlySpending(monthExpense)

    const { data: savings } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('family_id', fid)
      .eq('scope', 'family')

    let totalTarget = 0
    let totalCurrent = 0
    ;(savings || []).forEach((s: any) => {
      totalTarget += s.target_amount
      totalCurrent += s.current_amount
    })

    setSavingsTarget(totalTarget)
    setSavingsCurrent(totalCurrent)
    setSavingsProgress(totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function changeLanguage(next: Language) {
    setLanguage(next)
    window.localStorage.setItem('app-language', next)
  }

  const menuCards = useMemo(() => {
    const cards = [
      {
        href: '/family-summary',
        title: t.actions.report,
        desc: t.actions.reportDesc,
        icon: FileText,
      },
      {
        href: '/financial-health',
        title: t.actions.financialHealth,
        desc: t.actions.financialHealthDesc,
        icon: HeartPulse,
      },
      {
        href: '/dashboard',
        title: t.actions.personal,
        desc: t.actions.personalDesc,
        icon: Home,
      },
      {
        href: '/profile',
        title: t.actions.profile,
        desc: t.actions.profileDesc,
        icon: UserRound,
      },
    ]

    if (isAdmin) {
      cards.push({
        href: '/admin',
        title: t.actions.admin,
        desc: t.actions.adminDesc,
        icon: Shield,
      })
    }

    return cards
  }, [t, isAdmin])

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
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">{t.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">
              {t.welcome}, {user?.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <ThemeToggle />

            <div className="flex items-center rounded-md border border-border overflow-hidden">
              <Button size="sm" variant={language === 'id' ? 'default' : 'ghost'} onClick={() => changeLanguage('id')}>
                ID
              </Button>
              <Button size="sm" variant={language === 'en' ? 'default' : 'ghost'} onClick={() => changeLanguage('en')}>
                EN
              </Button>
            </div>

            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline">{t.admin}</Button>
              </Link>
            )}

            <Button onClick={handleLogout}>{t.logout}</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Menu</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {menuCards.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="group h-[168px] sm:h-[136px] rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
                <p className="mt-1 h-10 text-xs text-muted-foreground leading-tight line-clamp-2">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button
            variant={activeSection === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveSection('overview')}
          >
            {t.tabs.overview}
          </Button>
          <Button
            variant={activeSection === 'analytics' ? 'default' : 'outline'}
            onClick={() => setActiveSection('analytics')}
          >
            {t.tabs.analytics}
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          {activeSection === 'overview' && (
            <>
              <OverviewCards
                totalBalance={totalBalance}
                monthlySpending={monthlySpending}
                savingsTarget={savingsTarget}
                savingsCurrent={savingsCurrent}
                savingsProgress={savingsProgress}
                labels={t.overviewLabels}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/family-transactions">
                  <div className="rounded-xl border border-border p-4 hover:bg-accent transition-colors cursor-pointer">
                    <h3 className="font-semibold">
                      {language === 'en' ? 'Input Family Transaction' : 'Input Transaksi Family'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'en' ? 'Open family transaction input form' : 'Buka form input transaksi family'}
                    </p>
                  </div>
                </Link>

                <Link href="/family-savings">
                  <div className="rounded-xl border border-border p-4 hover:bg-accent transition-colors cursor-pointer">
                    <h3 className="font-semibold">
                      {language === 'en' ? 'Input Family Saving Plan' : 'Input Saving Plan Family'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'en' ? 'Open family savings target form' : 'Buka form target tabungan family'}
                    </p>
                  </div>
                </Link>
              </div>
            </>
          )}

          {activeSection === 'analytics' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpendingChart transactions={transactions} language={language} labels={t.chart} />
                <CategoryBreakdown transactions={transactions} labels={t.category} />
              </div>
              <TransactionNotesCard
                transactions={transactions}
                title={t.notesTitle}
                language={language}
                labels={t.notes}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
