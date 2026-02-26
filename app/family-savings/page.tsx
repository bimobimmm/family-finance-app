'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SavingsForm } from '@/components/savings/savings-form'
import { SavingsList } from '@/components/savings/savings-list'
import { Spinner } from '@/components/ui/spinner'

export default function FamilySavingsPage() {

  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [targets, setTargets] = useState<any[]>([])
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

    await loadTargets(member.family_id)

    setLoading(false)
  }

  async function loadTargets(fid: string) {
    const { data } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('family_id', fid)
      .eq('scope', 'family')
      .order('created_at', { ascending: false })

    setTargets(data || [])
  }

  async function handleAdd(formData: any) {

    await supabase.from('savings_targets').insert([
      {
        family_id: familyId,
        scope: 'family',
        name: formData.name,
        target_amount: parseFloat(formData.targetAmount),
        current_amount: parseFloat(formData.currentAmount),
        created_at: new Date().toISOString(),
      },
    ])

    await loadTargets(familyId!)
  }

  async function handleDelete(id: string) {
    await supabase
      .from('savings_targets')
      .delete()
      .eq('id', id)

    await loadTargets(familyId!)
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
        <SavingsForm onSubmit={handleAdd} />
      </div>

      {/* LIST */}
      <div className="lg:col-span-2">
        <SavingsList
          targets={targets}
          onDelete={handleDelete}
        />
      </div>

    </div>
  )
}