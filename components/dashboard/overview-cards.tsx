'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wallet, TrendingUp, Target, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getSavingWarning } from '@/lib/saving-warning'

interface Props {
  totalBalance: number
  monthlySpending: number
  savingsTarget: number
  savingsProgress?: number
}

export function OverviewCards({
  totalBalance,
  monthlySpending,
  savingsTarget,
  savingsProgress = 0,
}: Props) {
  const savingsWarning = getSavingWarning(totalBalance, savingsTarget)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Total Balance</CardTitle>
          <Wallet className="text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBalance)}
          </div>

          {savingsWarning && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Peringatan Saving</AlertTitle>
              <AlertDescription>
                {savingsWarning}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Monthly Spending</CardTitle>
          <TrendingUp className="text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(monthlySpending)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Savings Target</CardTitle>
          <Target className="text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(savingsTarget)}
          </div>

          <div className="mt-3">
            <Progress value={savingsProgress} className="h-2" />
            <p className="text-xs mt-1 text-muted-foreground">
              {savingsProgress}% completed
            </p>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}
