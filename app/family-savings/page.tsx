'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { SavingsForm } from '@/components/savings/savings-form'
import { SavingsList } from '@/components/savings/savings-list'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft } from 'lucide-react'
import { writeActivityLog } from '@/lib/activity-log'

export default function FamilySavingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [targets, setTargets] = useState<any[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [editingTarget, setEditingTarget] = useState<any | null>(null)

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

    const { data: member, error } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error) {
      console.error('Family membership error:', error)
    }

    if (!member) {
      router.push('/family-hub')
      return
    }

    setFamilyId(member.family_id)
    await loadTargets(member.family_id)
    setLoading(false)
  }

  async function loadTargets(fid: string) {
    const { data, error } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('family_id', fid)
      .eq('scope', 'family')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading family savings:', error)
    }

    setTargets(data || [])
  }

  async function handleAdd(formData: any) {
    if (!familyId || !user) return

    setSubmitting(true)

    try {
      if (editingTarget) {
        const { data, error } = await supabase
          .from('savings_targets')
          .update({
            name: formData.name,
            target_amount: parseFloat(formData.targetAmount),
            current_amount: parseFloat(formData.currentAmount),
            due_date: formData.dueDate || null,
            notes: formData.notes,
          })
          .eq('id', editingTarget.id)
          .select('*')
          .maybeSingle()

        if (!error && data?.id) {
          await writeActivityLog(supabase, {
            actor_user_id: user.id,
            action: 'update',
            entity_type: 'savings_target',
            entity_id: data.id,
            scope: 'family',
            family_id: familyId,
            note: `${data.name} target Rp ${Number(data.target_amount || 0).toLocaleString('id-ID')}`,
          })
        }

        if (error) {
          alert(error.message)
          return
        }

        setEditingTarget(null)
        await loadTargets(familyId)
        return
      }

      const payload = {
        user_id: user.id,
        family_id: familyId,
        scope: 'family',
        name: formData.name,
        target_amount: parseFloat(formData.targetAmount),
        current_amount: parseFloat(formData.currentAmount),
        due_date: formData.dueDate || null,
        notes: formData.notes,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from('savings_targets').insert([
        payload,
      ]).select('*').maybeSingle()

      if (!error && data?.id) {
        await writeActivityLog(supabase, {
          actor_user_id: user.id,
          action: 'create',
          entity_type: 'savings_target',
          entity_id: data.id,
          scope: 'family',
          family_id: familyId,
          note: `${data.name} target Rp ${Number(data.target_amount || 0).toLocaleString('id-ID')}`,
        })
      }

      if (error) {
        alert(error.message)
        return
      }

      setEditingTarget(null)
      await loadTargets(familyId)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!familyId || !user) return

    const { data: existing } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase
      .from('savings_targets')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await writeActivityLog(supabase, {
      actor_user_id: user.id,
      action: 'delete',
      entity_type: 'savings_target',
      entity_id: id,
      scope: 'family',
      family_id: familyId,
      note: existing
        ? `${existing.name} target Rp ${Number(existing.target_amount || 0).toLocaleString('id-ID')}`
        : 'Savings target deleted',
    })

    await loadTargets(familyId)
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
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/family-hub">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold">Family Savings</h1>
            <p>Manage shared savings goals</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <SavingsForm
              onSubmit={handleAdd}
              loading={submitting}
              defaultValues={
                editingTarget
                  ? {
                      name: editingTarget.name || '',
                      targetAmount: String(editingTarget.target_amount ?? ''),
                      currentAmount: String(editingTarget.current_amount ?? '0'),
                      dueDate: editingTarget.due_date || '',
                      notes: editingTarget.notes || '',
                    }
                  : undefined
              }
            />
            {editingTarget && (
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => setEditingTarget(null)}
              >
                Cancel Edit
              </Button>
            )}
          </div>

          <div className="lg:col-span-2">
            <SavingsList
              targets={targets}
              onEdit={(target) => setEditingTarget(target)}
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
