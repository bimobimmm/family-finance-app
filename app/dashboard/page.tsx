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
import {
  FileText,
  Users,
  UserRound,
  Shield,
  HeartPulse,
} from 'lucide-react'

type Language = 'id' | 'en'
type DashboardSection = 'overview' | 'analytics'

const COPY = {
  id: {
    title: 'Save Your Money!',
    welcome: 'Selamat datang kembali',
    admin: 'Admin',
    profile: 'Profile',
    familyHub: 'Family Hub',
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
      currentSavingHint: 'Diambil dari input Saving Plan (current amount)',
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
    notesTitle: 'Catatan Pemasukan & Pengeluaran',
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
    },
    actions: {
      transactions: 'Transaksi',
      transactionsDesc: 'Tambah & kelola transaksi',
      inputTransaction: 'Input Transaksi',
      inputTransactionDesc: 'Buka form input transaksi',
      savings: 'Saving Plan',
      savingsDesc: 'Atur target tabungan',
      inputSaving: 'Input Saving Plan',
      inputSavingDesc: 'Buka form target tabungan',
      summary: 'Laporan',
      summaryDesc: 'Ringkasan bulanan',
      financialHealth: 'Financial Health',
      financialHealthDesc: 'Skor kesehatan keuangan',
      family: 'Family Hub',
      familyDesc: 'Kelola keuangan keluarga',
      profile: 'Profile',
      profileDesc: 'Data akun dan family',
      admin: 'Admin',
      adminDesc: 'Kelola seluruh data',
    },
  },
  en: {
    title: 'Save Your Money!',
    welcome: 'Welcome back',
    admin: 'Admin',
    profile: 'Profile',
    familyHub: 'Family Hub',
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
      currentSavingHint: 'Taken from Saving Plan input (current amount)',
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
    notesTitle: 'Income & Expense Notes',
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
    },
    actions: {
      transactions: 'Transactions',
      transactionsDesc: 'Add & manage transactions',
      inputTransaction: 'Input Transaction',
      inputTransactionDesc: 'Open transaction input form',
      savings: 'Saving Plan',
      savingsDesc: 'Set savings targets',
      inputSaving: 'Input Saving Plan',
      inputSavingDesc: 'Open savings target form',
      summary: 'Reports',
      summaryDesc: 'Monthly summary',
      financialHealth: 'Financial Health',
      financialHealthDesc: 'Finance health score',
      family: 'Family Hub',
      familyDesc: 'Manage family finance',
      profile: 'Profile',
      profileDesc: 'Account and family data',
      admin: 'Admin',
      adminDesc: 'Manage all data',
    },
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [language, setLanguage] = useState<Language>('id')
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview')
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
    await loadPersonal(session.user.id)
    setLoading(false)
  }

  async function loadPersonal(userId: string) {
    const { data: trx } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('scope', 'personal')

    setTransactions(trx || [])

    let balance = 0
    let monthExpense = 0
    const now = new Date()

    trx?.forEach((row: any) => {
      const date = new Date(row.created_at)
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

  const quickActionCards = useMemo(() => {
    const base = [
      {
        href: '/summary',
        title: t.actions.summary,
        desc: t.actions.summaryDesc,
        icon: FileText,
      },
      {
        href: '/financial-health',
        title: t.actions.financialHealth,
        desc: t.actions.financialHealthDesc,
        icon: HeartPulse,
      },
      {
        href: '/family-hub',
        title: t.actions.family,
        desc: t.actions.familyDesc,
        icon: Users,
      },
      {
        href: '/profile',
        title: t.actions.profile,
        desc: t.actions.profileDesc,
        icon: UserRound,
      },
    ]

    if (isAdmin) {
      base.push({
        href: '/admin',
        title: t.actions.admin,
        desc: t.actions.adminDesc,
        icon: Shield,
      })
    }

    return base
  }, [t, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
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
          {quickActionCards.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer min-h-[118px]">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-tight">{item.desc}</p>
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
                <Link href="/transactions">
                  <div className="rounded-xl border border-border p-4 hover:bg-accent transition-colors cursor-pointer">
                    <h3 className="font-semibold">{t.actions.inputTransaction}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.actions.inputTransactionDesc}</p>
                  </div>
                </Link>

                <Link href="/savings">
                  <div className="rounded-xl border border-border p-4 hover:bg-accent transition-colors cursor-pointer">
                    <h3 className="font-semibold">{t.actions.inputSaving}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.actions.inputSavingDesc}</p>
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
