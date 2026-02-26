'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import { SavingsForm } from '@/components/savings/savings-form'
import { SavingsList } from '@/components/savings/savings-list'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

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

    // 🔹 SAFE QUERY (tidak pakai .single())
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

    if (!familyId) return

    const { error } = await supabase.from('savings_targets').insert([
      {
        family_id: familyId,
        scope: 'family',
        name: formData.name,
        target_amount: parseFloat(formData.targetAmount),
        current_amount: parseFloat(formData.currentAmount),
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      alert(error.message)
      return
    }

    await loadTargets(familyId)
  }

  async function handleDelete(id: string) {

    if (!familyId) return

    const { error } = await supabase
      .from('savings_targets')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

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

      {/* HEADER */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Family Savings</h1>
            <p className="text-muted-foreground mt-1">
              Manage shared savings goals
            </p>
          </div>

          <Link href="/family-hub">
            <Button variant="outline">
              Back to Family Hub
            </Button>
          </Link>
        </div>
      </div>

      {/* CONTENT */}
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
    </div>
  )
}