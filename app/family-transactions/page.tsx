'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Spinner } from '@/components/ui/spinner'

export default function FamilyTransactionsPage() {

  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data: member } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', session.user.id)
      .single()

    if (!member) {
      router.push('/family-hub')
      return
    }

    setFamilyId(member.family_id)

    await loadTransactions(member.family_id)

    setLoading(false)
  }

  async function loadTransactions(fid: string) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_id', fid)
      .eq('scope', 'family')
      .order('created_at', { ascending: false })

    setTransactions(data || [])
  }

  async function handleAdd(formData: any) {

    await supabase.from('transactions').insert([
      {
        family_id: familyId,
        scope: 'family',
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        created_at: new Date().toISOString(),
      },
    ])

    await loadTransactions(familyId!)
  }

  async function handleDelete(id: string) {
    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    await loadTransactions(familyId!)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* FORM */}
      <div className="lg:col-span-1">
        <TransactionForm onSubmit={handleAdd} />
      </div>

      {/* LIST */}
      <div className="lg:col-span-2">
        <TransactionList
          transactions={transactions}
          onDelete={handleDelete}
        />
      </div>

    </div>
  )
}