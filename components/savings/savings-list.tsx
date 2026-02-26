'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2 } from 'lucide-react'

interface SavingsTarget {
  id: string
  name: string
  target_amount: number
  current_amount: number
  due_date?: string | null
  notes?: string
  created_by: string
}

interface SavingsListProps {
  targets?: SavingsTarget[]
  loading?: boolean
  onDelete?: (id: string) => void
  currentUserId?: string
}

export function SavingsList({
  targets = [],
  loading = false,
  onDelete,
  currentUserId,
}: SavingsListProps) {

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    )
  }

  if (targets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No savings goals yet.
          </p>
        </CardContent>
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

          const remaining = target.target_amount - target.current_amount

          return (
            <div key={target.id} className="border rounded-lg p-4 space-y-3">

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{target.name}</h3>
                  {target.notes && (
                    <p className="text-sm text-muted-foreground">
                      {target.notes}
                    </p>
                  )}
                </div>

                {onDelete &&
                  target.created_by === currentUserId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(target.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Rp {target.current_amount.toLocaleString()} / Rp {target.target_amount.toLocaleString()}
                  </span>
                  <span>{percentage}%</span>
                </div>

                <Progress value={percentage} />
              </div>

              {remaining > 0 && (
                <Badge variant="outline">
                  Need Rp {remaining.toLocaleString()} more
                </Badge>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}