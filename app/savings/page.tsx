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
  const [user, setUser] = useState<any>(null)
  const [targets, setTargets] = useState<any[]>([])
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
      await loadTargets(session.user.id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadTargets(userId: string) {
    const { data, error } = await supabase
      .from('savings_targets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading targets:', error)
      return
    }

    setTargets(data || [])
  }

  async function handleAddTarget(formData: any) {
    setSubmitting(true)

    const { error } = await supabase.from('savings_targets').insert([
      {
        user_id: user.id,
        name: formData.name,
        target_amount: Number(formData.targetAmount),
        current_amount: Number(formData.currentAmount),
        deadline: formData.deadline || null,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('Insert error:', error)
    } else {
      await loadTargets(user.id)
    }

    setSubmitting(false)
  }

  async function handleDeleteTarget(id: string) {
    await supabase.from('savings_targets').delete().eq('id', id)
    await loadTargets(user.id)
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
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <SavingsForm onSubmit={handleAddTarget} loading={submitting} />
        </div>

        <div className="lg:col-span-2">
          <SavingsList
            targets={targets}
            loading={false}
            onDelete={handleDeleteTarget}
          />
        </div>
      </div>
    </div>
  )
}