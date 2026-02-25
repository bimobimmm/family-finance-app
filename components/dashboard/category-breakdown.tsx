'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface Props {
  transactions: any[]
}

export function CategoryBreakdown({ transactions }: Props) {

  const categories: Record<string, number> = {}

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      categories[t.category] =
        (categories[t.category] || 0) + Number(t.amount)
    }
  })

  const data = Object.entries(categories).map(([category, value]) => ({
    category,
    value,
  }))

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              outerRadius={80}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}