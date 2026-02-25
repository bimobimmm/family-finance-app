'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Wallet, Target } from 'lucide-react'

interface OverviewCardsProps {
  loading?: boolean
  totalBalance?: number
  monthlySpending?: number
  savingsTarget?: number
}

export function OverviewCards({
  loading = false,
  totalBalance = 0,
  monthlySpending = 0,
  savingsTarget = 0,
}: OverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Balance',
      value: `$${totalBalance.toFixed(2)}`,
      icon: Wallet,
      color: 'text-blue-500',
    },
    {
      title: 'Monthly Spending',
      value: `$${monthlySpending.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-red-500',
    },
    {
      title: 'Savings Target',
      value: `$${savingsTarget.toFixed(2)}`,
      icon: Target,
      color: 'text-green-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Updated just now
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
