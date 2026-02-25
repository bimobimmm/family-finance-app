'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { TransactionList } from '@/components/transactions/transaction-list'
import { ArrowLeft } from 'lucide-react'

export default function TransactionsPage() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      await loadTransactions(session.user.id)
      setLoading(false)
    }

    init()
  }, [router, supabase])

  async function loadTransactions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading transactions:', error)
      } else {
        setTransactions(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  async function handleAddTransaction(formData: any) {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error('Error adding transaction:', error)
      } else {
        await loadTransactions(user.id)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteTransaction(id: string) {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id)

      if (error) {
        console.error('Error deleting transaction:', error)
      } else {
        await loadTransactions(user.id)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Transactions</h1>
              <p className="text-muted-foreground mt-1">
                Manage your income and expenses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <TransactionForm
              onSubmit={handleAddTransaction}
              loading={submitting}
            />
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <TransactionList
              transactions={transactions}
              loading={loading}
              onDelete={handleDeleteTransaction}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
