'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Transaction {
  id: string
  type: string
  amount: number
  category: string
  description?: string
  created_at: string
  created_by: string
}

interface TransactionListProps {
  transactions?: Transaction[]
  loading?: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  currentUserId?: string
  canManageAll?: boolean
}

export function TransactionList({
  transactions = [],
  loading = false,
  onEdit,
  onDelete,
  currentUserId,
  canManageAll = false,
}: TransactionListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            No transactions yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Transactions will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{transaction.category}</p>

                {transaction.description && (
                  <p className="text-sm text-muted-foreground">
                    {transaction.description}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(transaction.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                  {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString()}
                </Badge>

                {(canManageAll || transaction.created_by === currentUserId) && (
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
