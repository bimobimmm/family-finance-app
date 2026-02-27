'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wallet, TrendingUp, Target, AlertTriangle, PiggyBank } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getSavingWarning } from '@/lib/saving-warning'

interface Props {
  totalBalance: number
  monthlySpending: number
  savingsTarget: number
  savingsCurrent?: number
  savingsProgress?: number
  labels?: {
    totalBalance?: string
    monthlySpending?: string
    currentSaving?: string
    savingsTarget?: string
    savingWarningTitle?: string
    currentSavingHint?: string
    completedSuffix?: string
  }
}

export function OverviewCards({
  totalBalance,
  monthlySpending,
  savingsTarget,
  savingsCurrent = 0,
  savingsProgress = 0,
  labels,
}: Props) {
  const savingsWarning = getSavingWarning(savingsCurrent, savingsTarget)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>{labels?.totalBalance || 'Total Balance'}</CardTitle>
          <Wallet className="text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBalance)}
          </div>

          {savingsWarning && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{labels?.savingWarningTitle || 'Peringatan Saving'}</AlertTitle>
              <AlertDescription>
                {savingsWarning}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>{labels?.monthlySpending || 'Monthly Spending'}</CardTitle>
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
          <CardTitle>{labels?.currentSaving || 'Tabungan Saat Ini'}</CardTitle>
          <PiggyBank className="text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(savingsCurrent)}
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            {labels?.currentSavingHint || 'Diambil dari input Saving Plan (current amount)'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>{labels?.savingsTarget || 'Savings Target'}</CardTitle>
          <Target className="text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(savingsTarget)}
          </div>

          <div className="mt-3">
            <Progress value={savingsProgress} className="h-2" />
            <p className="text-xs mt-1 text-muted-foreground">
              {savingsProgress}% {labels?.completedSuffix || 'completed'}
            </p>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}
