'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}

function toNumericString(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits || '0'
}

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

  useEffect(() => {
    setName(defaultValues?.name || '')
    setTargetAmount(formatCurrencyInput(defaultValues?.targetAmount || ''))
    setCurrentAmount(formatCurrencyInput(defaultValues?.currentAmount || '0'))
    setDueDate(defaultValues?.dueDate || '')
    setNotes(defaultValues?.notes || '')
  }, [defaultValues])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      targetAmount: toNumericString(targetAmount),
      currentAmount: toNumericString(currentAmount),
      dueDate,
      notes,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {defaultValues ? 'Edit Savings Goal' : 'Create Savings Goal'}
        </CardTitle>
        <CardDescription>
          {defaultValues
            ? 'Update your savings target details'
            : 'Set up a new savings target to work towards'}
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
                type="text"
                inputMode="numeric"
                placeholder="5000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(formatCurrencyInput(e.target.value))}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount ($)</Label>
              <Input
                id="currentAmount"
                type="text"
                inputMode="numeric"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(formatCurrencyInput(e.target.value))}
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
            {loading
              ? 'Saving...'
              : defaultValues
              ? 'Update Goal'
              : 'Create Goal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
