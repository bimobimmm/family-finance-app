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
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null)

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
  }, [router])

  async function loadTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) {
      setTransactions(data || [])
    }
  }

  // 🔥 HANDLE ADD OR UPDATE
  async function handleSubmitTransaction(formData: any) {
    setSubmitting(true)

    try {
      if (editingTransaction) {
        // UPDATE MODE
        const { error } = await supabase
          .from('transactions')
          .update({
            type: formData.type,
            amount: Number(formData.amount),
            category: formData.category,
            description: formData.description,
          })
          .eq('id', editingTransaction.id)

        if (error) {
          console.error('Update error:', error)
        } else {
          setEditingTransaction(null)
          await loadTransactions(user.id)
        }

      } else {
        // INSERT MODE
        const { error } = await supabase.from('transactions').insert([
          {
            user_id: user.id,
            type: formData.type,
            amount: Number(formData.amount),
            category: formData.category,
            description: formData.description,
            created_at: new Date().toISOString(),
          },
        ])

        if (error) {
          console.error('Insert error:', error)
        } else {
          await loadTransactions(user.id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (!error) {
      await loadTransactions(user.id)
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

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Form */}
          <div className="lg:col-span-1">
            <TransactionForm
              onSubmit={handleSubmitTransaction}
              loading={submitting}
              defaultValues={editingTransaction}
            />
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <TransactionList
              transactions={transactions}
              loading={loading}
              onDelete={handleDeleteTransaction}
              onEdit={(transaction) => setEditingTransaction(transaction)}
            />
          </div>

        </div>
      </div>
    </div>
  )
}