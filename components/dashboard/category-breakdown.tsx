'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  transactions: any[]
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6'
]

export function CategoryBreakdown({ transactions }: Props) {

  const categories: Record<string, number> = {}

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      categories[t.category] = (categories[t.category] || 0) + Number(t.amount)
    }
  })

  const data = Object.entries(categories).map(([category, value]) => ({
    name: category,
    value
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>

      <CardContent className="h-[260px]">

        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No category data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ value }) =>
                  `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
                }
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(v: any) =>
                  `Rp ${new Intl.NumberFormat('id-ID').format(v)}`
                }
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

      </CardContent>
    </Card>
  )
}