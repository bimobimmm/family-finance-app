'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SavingsForm } from '@/components/savings/savings-form'
import { SavingsList } from '@/components/savings/savings-list'
import { ArrowLeft } from 'lucide-react'

export default function SavingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [targets, setTargets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [familyId, setFamilyId] = useState<string | null>(null)
  const [scope, setScope] = useState<'personal' | 'family'>('personal')

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

    await loadFamily(session.user.id)
    await loadTargets(session.user.id, null)

    setLoading(false)
  }

  async function loadFamily(userId: string) {
    const { data } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', userId)
      .single()

    if (data) setFamilyId(data.family_id)
  }

  async function loadTargets(userId: string, modeFamilyId: string | null) {

    let query = supabase.from('savings_targets').select('*')

    if (modeFamilyId) {
      query = query
        .eq('scope', 'family')
        .eq('family_id', modeFamilyId)
    } else {
      query = query
        .eq('scope', 'personal')
        .eq('user_id', userId)
    }

    const { data } = await query.order('created_at', { ascending: false })
    setTargets(data || [])
  }

  async function handleAddTarget(formData: any) {
    setSubmitting(true)

    try {
      const { error } = await supabase.from('savings_targets').insert([
        {
          user_id: user.id,
          name: formData.name,
          target_amount: parseFloat(formData.targetAmount),
          current_amount: parseFloat(formData.currentAmount),
          due_date: formData.dueDate || null,
          notes: formData.notes,
          scope: scope,
          family_id: scope === 'family' ? familyId : null,
          created_by: user.id,
          created_at: new Date().toISOString(),
        },
      ])

      if (!error) {
        await loadTargets(
          user.id,
          scope === 'family' ? familyId : null
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteTarget(id: string) {
    await supabase.from('savings_targets').delete().eq('id', id)

    await loadTargets(
      user.id,
      scope === 'family' ? familyId : null
    )
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
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold">Savings Goals</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Mode Switch */}
        <div className="flex gap-3">
          <Button
            variant={scope === 'personal' ? 'default' : 'outline'}
            onClick={() => {
              setScope('personal')
              loadTargets(user.id, null)
            }}
          >
            Personal
          </Button>

          {familyId && (
            <Button
              variant={scope === 'family' ? 'default' : 'outline'}
              onClick={() => {
                setScope('family')
                loadTargets(user.id, familyId)
              }}
            >
              Family
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <SavingsForm
              onSubmit={handleAddTarget}
              loading={submitting}
            />
          </div>

          <div className="lg:col-span-2">
            <SavingsList
              targets={targets}
              onDelete={handleDeleteTarget}
              currentUserId={user.id}
            />
          </div>
        </div>

      </div>
    </div>
  )
}