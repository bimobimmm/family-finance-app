'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const CATEGORIES = [
  'Groceries',
  'Utilities',
  'Entertainment',
  'Transportation',
  'Healthcare',
  'Dining',
  'Shopping',
  'Other',
]

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
]

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}

function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

interface TransactionFormProps {
  onSubmit: (data: any) => void
  loading?: boolean
  defaultValues?: any
}

export function TransactionForm({
  onSubmit,
  loading = false,
  defaultValues,
}: TransactionFormProps) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (defaultValues) {
      setType(defaultValues.type)
      setAmount(formatCurrencyInput(String(defaultValues.amount)))
      setCategory(defaultValues.category)
      setDescription(defaultValues.description || '')
    }
  }, [defaultValues])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...defaultValues,
      type,
      amount: parseCurrencyInput(amount),
      category,
      description,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {defaultValues ? 'Edit Transaction' : 'Add Transaction'}
        </CardTitle>
        <CardDescription>
          {defaultValues
            ? 'Update your transaction details'
            : 'Record a new income or expense'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (Rp)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? 'Saving...'
              : defaultValues
              ? 'Update Transaction'
              : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
