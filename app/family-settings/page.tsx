'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export default function FamilySettingsPage() {

  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [family, setFamily] = useState<any>(null)

  const [familyName, setFamilyName] = useState('')
  const [joinCode, setJoinCode] = useState('')

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

    if (member) {
      const { data: fam } = await supabase
        .from('families')
        .select('*')
        .eq('id', member.family_id)
        .single()

      setFamily(fam)
    }

    setLoading(false)
  }

  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async function handleCreateFamily() {

    if (!familyName) return

    const inviteCode = generateCode()

    const { data: newFamily, error } = await supabase
      .from('families')
      .insert([
        {
          name: familyName,
          invite_code: inviteCode,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      return
    }

    await supabase.from('family_members').insert([
      {
        family_id: newFamily.id,
        user_id: user.id,
      },
    ])

    setFamily(newFamily)
    setFamilyName('')
  }

  async function handleJoinFamily() {

    if (!joinCode) return

    const { data: fam } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', joinCode.toUpperCase())
      .single()

    if (!fam) {
      alert('Invalid code')
      return
    }

    await supabase.from('family_members').insert([
      {
        family_id: fam.id,
        user_id: user.id,
      },
    ])

    setFamily(fam)
    setJoinCode('')
  }

  async function handleLeaveFamily() {

    await supabase
      .from('family_members')
      .delete()
      .eq('user_id', user.id)

    setFamily(null)
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
        <div className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Family Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your family configuration
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
      <div className="max-w-xl mx-auto py-12 px-6">

        <Card>
          <CardHeader>
            <CardTitle>Family Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            {!family && (
              <>
                {/* CREATE FAMILY */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Create New Family</p>
                  <Input
                    placeholder="Family Name"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                  <Button onClick={handleCreateFamily}>
                    Create Family
                  </Button>
                </div>

                {/* JOIN FAMILY */}
                <div className="space-y-2 pt-6 border-t border-border">
                  <p className="text-sm font-medium">Join Existing Family</p>
                  <Input
                    placeholder="Invite Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleJoinFamily}>
                    Join Family
                  </Button>
                </div>
              </>
            )}

            {family && (
              <>
                <div>
                  <p className="font-semibold text-lg">
                    {family.name}
                  </p>
                  <p className="text-muted-foreground">
                    Invite Code:{' '}
                    <span className="font-mono bg-muted px-2 py-1 rounded">
                      {family.invite_code}
                    </span>
                  </p>
                </div>

                <Button variant="destructive" onClick={handleLeaveFamily}>
                  Leave Family
                </Button>
              </>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  )
}