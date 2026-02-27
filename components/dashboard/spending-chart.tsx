'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  transactions: any[]
  language?: 'id' | 'en'
  labels?: {
    title?: string
    totalPeriod?: string
    sevenDays?: string
    thirtyDays?: string
    noData?: string
  }
}

export function SpendingChart({ transactions, language = 'id', labels }: Props) {
  const [rangeDays, setRangeDays] = useState<7 | 30>(7)
  const locale = language === 'en' ? 'en-US' : 'id-ID'

  const data = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startDate = new Date(today)
    startDate.setDate(today.getDate() - rangeDays + 1)

    const daily: Record<string, number> = {}

    transactions.forEach((t) => {
      if (t.type !== 'expense') return

      const date = new Date(t.created_at)
      if (Number.isNaN(date.getTime())) return

      date.setHours(0, 0, 0, 0)
      if (date < startDate || date > today) return

      const key = date.toISOString().slice(0, 10)
      daily[key] = (daily[key] || 0) + Number(t.amount)
    })

    const rows: Array<{ date: string; dateLabel: string; spending: number }> = []
    for (let i = 0; i < rangeDays; i += 1) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const key = currentDate.toISOString().slice(0, 10)

      rows.push({
        date: key,
        dateLabel: currentDate.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }),
        spending: daily[key] || 0,
      })
    }

    return rows
  }, [transactions, rangeDays, locale])

  const hasExpenseData = data.some((item) => item.spending > 0)
  const total = data.reduce((sum, item) => sum + item.spending, 0)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>{labels?.title || 'Daily Spending'}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {labels?.totalPeriod || 'Total period'}: Rp {total.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant={rangeDays === 7 ? 'default' : 'outline'} onClick={() => setRangeDays(7)}>
              {labels?.sevenDays || '7 Days'}
            </Button>
            <Button size="sm" variant={rangeDays === 30 ? 'default' : 'outline'} onClick={() => setRangeDays(30)}>
              {labels?.thirtyDays || '30 Days'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[300px]">
        {!hasExpenseData ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            {labels?.noData || 'No expense data in the selected period'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 14, right: 8, left: 8, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <linearGradient id="spendingBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.8} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(v)}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.25 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm font-semibold">Rp {Number(row.spending || 0).toLocaleString('id-ID')}</p>
                    </div>
                  )
                }}
              />

              <Bar dataKey="spending" fill="url(#spendingBarGradient)" radius={[10, 10, 0, 0]} barSize={rangeDays === 7 ? 34 : 16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

