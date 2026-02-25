'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface SpendingChartProps {
  data?: Array<{
    month: string
    spending: number
    budget: number
  }>
}

export function SpendingChart({ data }: SpendingChartProps) {
  const defaultData = [
    { month: 'Jan', spending: 400, budget: 500 },
    { month: 'Feb', spending: 300, budget: 500 },
    { month: 'Mar', spending: 200, budget: 500 },
    { month: 'Apr', spending: 278, budget: 500 },
    { month: 'May', spending: 189, budget: 500 },
    { month: 'Jun', spending: 239, budget: 500 },
  ]

  const chartData = data || defaultData

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
        <CardDescription>
          Your spending vs budget for the past 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spending" fill="#ef4444" />
            <Bar dataKey="budget" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
