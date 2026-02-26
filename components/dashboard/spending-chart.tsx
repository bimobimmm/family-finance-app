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
}

export function SpendingChart({ transactions }: Props) {
  const [rangeDays, setRangeDays] = useState<7 | 30>(7)

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
        dateLabel: currentDate.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
        }),
        spending: daily[key] || 0,
      })
    }

    return rows
  }, [transactions, rangeDays])

  const hasExpenseData = data.some((item) => item.spending > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Daily Spending</CardTitle>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={rangeDays === 7 ? 'default' : 'outline'}
              onClick={() => setRangeDays(7)}
            >
              7 Hari
            </Button>
            <Button
              size="sm"
              variant={rangeDays === 30 ? 'default' : 'outline'}
              onClick={() => setRangeDays(30)}
            >
              30 Hari
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[260px]">
        {!hasExpenseData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No expense data in the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />

              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tickFormatter={(v) =>
                  new Intl.NumberFormat('id-ID', {
                    notation: 'compact',
                  }).format(v)
                }
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                labelFormatter={(_, payload) => {
                  const rawDate = payload?.[0]?.payload?.date
                  if (!rawDate) return ''
                  return new Date(rawDate).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                }}
                formatter={(v: any) =>
                  `Rp ${new Intl.NumberFormat('id-ID').format(v)}`
                }
              />

              <Bar
                dataKey="spending"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
