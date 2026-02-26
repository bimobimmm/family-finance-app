'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  transactions: any[]
}

export function SpendingChart({ transactions }: Props) {

  const daily: Record<string, number> = {}

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      const date = new Date(t.created_at)
      const key = date.toLocaleDateString('id-ID')
      daily[key] = (daily[key] || 0) + Number(t.amount)
    }
  })

  const data = Object.entries(daily).map(([date, value]) => ({
    date,
    spending: value
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spending</CardTitle>
      </CardHeader>

      <CardContent className="h-[260px]">

        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No expense data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
              barCategoryGap="20%"   // 🔥 lebih rapat
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tickFormatter={(v) =>
                  new Intl.NumberFormat('id-ID', {
                    notation: 'compact'
                  }).format(v)
                }
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                formatter={(v: any) =>
                  `Rp ${new Intl.NumberFormat('id-ID').format(v)}`
                }
              />

              <Bar
                dataKey="spending"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={40}   // 🔥 lebih proporsional
              />
            </BarChart>
          </ResponsiveContainer>
        )}

      </CardContent>
    </Card>
  )
}