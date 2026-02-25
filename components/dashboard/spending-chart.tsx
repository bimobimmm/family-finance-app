'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface Props {
  transactions: any[]
}

export function SpendingChart({ transactions }: Props) {

  const monthly: Record<string, number> = {}

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      const date = new Date(t.created_at)
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`
      monthly[key] = (monthly[key] || 0) + Number(t.amount)
    }
  })

  const data = Object.entries(monthly).map(([month, spending]) => ({
    month,
    spending,
  }))

  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
      </CardHeader>

      <CardContent className="h-80 pl-6 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />

            <XAxis
              dataKey="month"
              stroke="#aaa"
            />

            <YAxis
              stroke="#aaa"
              tickFormatter={(value) =>
                new Intl.NumberFormat('id-ID').format(value)
              }
              domain={[0, 'dataMax + 500000']}
            />

            <Tooltip
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#111',
                border: '1px solid #333',
              }}
              labelStyle={{ color: '#fff' }}
            />

            <Bar
              dataKey="spending"
              radius={[8, 8, 0, 0]}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>

          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}