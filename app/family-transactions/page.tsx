'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft } from 'lucide-react'
import { writeActivityLog } from '@/lib/activity-log'
import { getSavingWarning } from '@/lib/saving-warning'
import { toast } from 'sonner'

export default function FamilyTransactionsPage() {

  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser(session.user)

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
    if (!familyId || !user) return

    setSubmitting(true)

    try {
      if (editingTransaction) {
        const { data, error } = await supabase
          .from('transactions')
          .update({
            type: formData.type,
            amount: parseFloat(formData.amount),
            category: formData.category,
            description: formData.description,
          })
          .eq('id', editingTransaction.id)
          .select('*')
          .maybeSingle()

        if (error) {
          toast.error('Gagal update transaksi family', {
            description: error.message,
          })
          return
        }

        if (!error && data?.id) {
          await writeActivityLog(supabase, {
            actor_user_id: user.id,
            action: 'update',
            entity_type: 'transaction',
            entity_id: data.id,
            scope: 'family',
            family_id: familyId,
            note: `${data.type} ${data.category} Rp ${Number(data.amount || 0).toLocaleString('id-ID')}${data.description ? ` | ${data.description}` : ''}`,
          })
        }

        if (!error) {
          setEditingTransaction(null)
          await loadTransactions(familyId)
        }

        return
      }

      const payload = {
        user_id: user.id,
        family_id: familyId,
        scope: 'family',
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from('transactions').insert([
        payload,
      ]).select('*').maybeSingle()

      if (error) {
        toast.error('Gagal menyimpan transaksi family', {
          description: error.message,
        })
        return
      }

      if (!error && data?.id) {
        await writeActivityLog(supabase, {
          actor_user_id: user.id,
          action: 'create',
          entity_type: 'transaction',
          entity_id: data.id,
          scope: 'family',
          family_id: familyId,
          note: `${data.type} ${data.category} Rp ${Number(data.amount || 0).toLocaleString('id-ID')}${data.description ? ` | ${data.description}` : ''}`,
        })
      }

      if (!error) {
        setEditingTransaction(null)
        await loadTransactions(familyId)

        const amountText = `Rp ${Number(data?.amount || formData.amount || 0).toLocaleString('id-ID')}`
        const detail = `${data?.category || formData.category}${(data?.description || formData.description) ? ` | ${data?.description || formData.description}` : ''}`

        if (formData.type === 'income') {
          toast.success('Pemasukan family berhasil dicatat :)', {
            description: `+${amountText} | ${detail}`,
          })
        } else {
          toast.error('Pengeluaran family tercatat :(', {
            description: `-${amountText} | ${detail}`,
          })
        }

        if (formData.type === 'expense') {
          await showFamilySavingWarning(familyId)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function showFamilySavingWarning(fid: string) {
    const { data: trx } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('scope', 'family')
      .eq('family_id', fid)

    const { data: savings } = await supabase
      .from('savings_targets')
      .select('target_amount')
      .eq('scope', 'family')
      .eq('family_id', fid)

    let balance = 0
    ;(trx || []).forEach((t: any) => {
      const amount = Number(t.amount || 0)
      if (t.type === 'income') balance += amount
      if (t.type === 'expense') balance -= amount
    })

    const target = (savings || []).reduce(
      (sum: number, s: any) => sum + Number(s.target_amount || 0),
      0,
    )

    const warning = getSavingWarning(balance, target)
    if (warning) alert(warning)
  }

  async function handleDelete(id: string) {
    if (!familyId || !user) return

    const { data: existing } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    await writeActivityLog(supabase, {
      actor_user_id: user.id,
      action: 'delete',
      entity_type: 'transaction',
      entity_id: id,
      scope: 'family',
      family_id: familyId,
      note: existing
        ? `${existing.type} ${existing.category} Rp ${Number(existing.amount || 0).toLocaleString('id-ID')}${existing.description ? ` | ${existing.description}` : ''}`
        : 'Transaction deleted',
    })

    await loadTransactions(familyId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/family-hub">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold">Family Transactions</h1>
            <p>Manage shared income and expenses</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <TransactionForm
              onSubmit={handleAdd}
              loading={submitting}
              defaultValues={editingTransaction}
            />
            {editingTransaction && (
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => setEditingTransaction(null)}
              >
                Cancel Edit
              </Button>
            )}
          </div>

          <div className="lg:col-span-2">
            <TransactionList
              transactions={transactions}
              onEdit={(transaction) => setEditingTransaction(transaction)}
              onDelete={handleDelete}
              currentUserId={user?.id}
              canManageAll
            />
          </div>
        </div>
      </div>
    </div>
  )
}
