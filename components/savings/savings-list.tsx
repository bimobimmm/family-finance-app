'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SavingsTarget {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string | null
}

interface Props {
  targets: SavingsTarget[]
  loading?: boolean
  onDelete?: (id: string) => void
}

export function SavingsList({ targets, onDelete }: Props) {

  if (targets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>No goals yet.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Savings Goals</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {targets.map((target) => {

          const percentage = Math.round(
            (target.current_amount / target.target_amount) * 100
          )

          const remaining =
            target.target_amount - target.current_amount

          return (
            <div key={target.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">{target.name}</h3>

                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(target.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="text-sm mb-2">
                {formatCurrency(target.current_amount)} of{' '}
                {formatCurrency(target.target_amount)}
              </div>

              <Progress value={Math.min(percentage, 100)} className="h-2" />

              <div className="text-xs mt-2 text-muted-foreground">
                {percentage}% complete
              </div>

              {remaining > 0 && (
                <div className="text-sm mt-3">
                  Need to save {formatCurrency(remaining)} more
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}