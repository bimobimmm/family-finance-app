'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, DollarSign } from 'lucide-react'

interface SavingsTarget {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  dueDate?: string | null
  notes?: string
}

interface SavingsListProps {
  targets?: SavingsTarget[]
  loading?: boolean
  onDelete?: (id: string) => void
}

export function SavingsList({
  targets = [],
  loading = false,
  onDelete,
}: SavingsListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (targets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Savings Goals</CardTitle>
          <CardDescription>
            No savings goals yet. Create one to get started!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Goals you create will appear here with progress tracking.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Savings Goals</CardTitle>
        <CardDescription>
          {targets.length} goal{targets.length !== 1 ? 's' : ''} being tracked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {targets.map((target) => {
            const percentage = Math.round(
              (target.currentAmount / target.targetAmount) * 100
            )
            const isComplete = target.currentAmount >= target.targetAmount

            return (
              <div key={target.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{target.name}</h3>
                    {target.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {target.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isComplete && (
                      <Badge className="bg-green-600 text-white">
                        Completed
                      </Badge>
                    )}
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
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      ${target.currentAmount.toFixed(2)} of ${target.targetAmount.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage}% complete</span>
                    {target.dueDate && (
                      <span>
                        Due: {new Date(target.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {!isComplete && (
                  <div className="mt-4 p-3 bg-accent/50 rounded text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        Need to save ${(target.targetAmount - target.currentAmount).toFixed(2)} more
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
