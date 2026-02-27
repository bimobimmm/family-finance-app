'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface Props {
  transactions: any[]
  title: string
  language?: 'id' | 'en'
  labels?: {
    sevenDays?: string
    thirtyDays?: string
    totalIncome?: string
    totalExpense?: string
    all?: string
    income?: string
    expense?: string
    empty?: string
    incomeFallback?: string
    expenseFallback?: string
  }
}

export function TransactionNotesCard({ transactions, title, language = 'id', labels }: Props) {
  const [rangeDays, setRangeDays] = useState<7 | 30>(7)
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')

  const dateFiltered = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    startDate.setDate(startDate.getDate() - rangeDays + 1)

    return transactions.filter((item) => {
      const d = new Date(item.created_at)
      if (Number.isNaN(d.getTime())) return false
      return d >= startDate && d <= today
    })
  }, [transactions, rangeDays])

  const incomeTotal = useMemo(
    () =>
      dateFiltered
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [dateFiltered],
  )

  const expenseTotal = useMemo(
    () =>
      dateFiltered
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [dateFiltered],
  )

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return dateFiltered
    return dateFiltered.filter((item) => item.type === typeFilter)
  }, [dateFiltered, typeFilter])

  const sorted = [...filtered]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>{title}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={rangeDays === 7 ? 'default' : 'outline'}
              onClick={() => setRangeDays(7)}
            >
              {labels?.sevenDays || '7 Hari'}
            </Button>
              <Button
                size="sm"
                variant={rangeDays === 30 ? 'default' : 'outline'}
              onClick={() => setRangeDays(30)}
            >
              {labels?.thirtyDays || '30 Hari'}
            </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-green-500/5 p-3">
              <p className="text-xs text-muted-foreground">{labels?.totalIncome || 'Total Pemasukan'}</p>
              <p className="font-semibold text-green-600">
                +Rp {incomeTotal.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="rounded-lg border bg-red-500/5 p-3">
              <p className="text-xs text-muted-foreground">{labels?.totalExpense || 'Total Pengeluaran'}</p>
              <p className="font-semibold text-red-600">
                -Rp {expenseTotal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('all')}
            >
              {labels?.all || 'Semua'}
            </Button>
            <Button
              size="sm"
              variant={typeFilter === 'income' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('income')}
            >
              {labels?.income || 'Pemasukan'}
            </Button>
            <Button
              size="sm"
              variant={typeFilter === 'expense' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('expense')}
            >
              {labels?.expense || 'Pengeluaran'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[420px] overflow-auto hide-scrollbar">
        {sorted.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {labels?.empty || 'Belum ada catatan transaksi untuk filter ini.'}
          </div>
        )}

        {sorted.map((item) => {
          const isIncome = item.type === 'income'
          const sign = isIncome ? '+' : '-'

          return (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {isIncome ? (
                    <ArrowUpCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {sign}Rp {Number(item.amount || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">
                      {item.description || item.category || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="shrink-0">
                  {item.category || (isIncome ? (labels?.incomeFallback || 'Income') : (labels?.expenseFallback || 'Expense'))}
                </Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
