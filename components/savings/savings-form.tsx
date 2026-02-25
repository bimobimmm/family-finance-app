'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface SavingsFormProps {
  onSubmit: (data: any) => void
  loading?: boolean
  defaultValues?: {
    name: string
    targetAmount: string
    currentAmount: string
    dueDate: string
    notes: string
  }
}

export function SavingsForm({
  onSubmit,
  loading = false,
  defaultValues,
}: SavingsFormProps) {
  const [name, setName] = useState(defaultValues?.name || '')
  const [targetAmount, setTargetAmount] = useState(defaultValues?.targetAmount || '')
  const [currentAmount, setCurrentAmount] = useState(defaultValues?.currentAmount || '0')
  const [dueDate, setDueDate] = useState(defaultValues?.dueDate || '')
  const [notes, setNotes] = useState(defaultValues?.notes || '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, targetAmount, currentAmount, dueDate, notes })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Savings Goal</CardTitle>
        <CardDescription>
          Set up a new savings target to work towards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              placeholder="e.g., Vacation, New Car"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="5000.00"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount ($)</Label>
              <Input
                id="currentAmount"
                type="number"
                placeholder="0.00"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Target Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this savings goal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
