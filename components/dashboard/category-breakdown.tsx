'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  transactions: any[]
  labels?: {
    title?: string
    noData?: string
    total?: string
  }
}

const COLORS = [
  '#2563eb',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
]

export function CategoryBreakdown({ transactions, labels }: Props) {
  const data = useMemo(() => {
    const categories: Record<string, number> = {}

    transactions.forEach((t) => {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + Number(t.amount)
      }
    })

    return Object.entries(categories)
      .map(([category, value]) => ({
        name: category,
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const total = data.reduce((sum, row) => sum + row.value, 0)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{labels?.title || 'Spending by Category'}</CardTitle>
      </CardHeader>

      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            {labels?.noData || 'No category data'}
          </div>
        ) : (
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={96}
                  stroke="none"
                  paddingAngle={2}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                        <p className="text-xs text-muted-foreground">{row.name}</p>
                        <p className="text-sm font-semibold">
                          Rp {Number(row.value || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 overflow-auto pr-1">
              <p className="text-sm font-semibold">
                {labels?.total || 'Total'}: Rp {total.toLocaleString('id-ID')}
              </p>
              {data.map((row, i) => (
                <div key={row.name} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="truncate">{row.name}</span>
                  </div>
                  <span className="font-medium">
                    {Math.round((row.value / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
