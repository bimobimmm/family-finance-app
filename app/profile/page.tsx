'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserRound, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [families, setFamilies] = useState<any[]>([])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser(session.user)
    await loadFamilies(session.user.id, session.access_token)
    setLoading(false)
  }

  async function loadFamilies(userId: string, accessToken: string) {
    const { data: myMemberships, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId)

    if (membersError) {
      console.error('Failed to load family_members:', membersError)
      setFamilies([])
      return
    }

    const familyIds = (myMemberships || []).map((m: any) => m.family_id)
    if (familyIds.length === 0) {
      setFamilies([])
      return
    }

    const { data: allFamilyMembers, error: allMembersError } = await supabase
      .from('family_members')
      .select('*')
      .in('family_id', familyIds)

    if (allMembersError) {
      console.warn('Failed to load all family members:', allMembersError)
    }

    const memberUserIds = Array.from(
      new Set((allFamilyMembers || []).map((m: any) => m.user_id).filter(Boolean)),
    )

    let emailByUserId = new Map<string, string | null>()
    try {
      const membersRes = await fetch('/api/family-members', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const membersPayload = await membersRes.json().catch(() => ({}))
      if (membersRes.ok) {
        emailByUserId = new Map(
          (membersPayload.members || []).map((m: any) => [m.user_id, m.email || null]),
        )
      } else {
        console.warn('Failed to load family member emails:', membersPayload?.error || 'unknown')
      }
    } catch (err) {
      console.warn('Failed to call /api/family-members:', err)
    }

    let profilesData: any[] = []
    if (memberUserIds.length > 0) {
      // Fallback schema: some environments use `profiles`, others use `users`.
      const { data: profilesTableData, error: profilesTableError } = await supabase
        .from('profiles')
        .select('id, name, full_name, email')
        .in('id', memberUserIds)

      if (!profilesTableError) {
        profilesData = profilesTableData || []
      } else {
        const { data: usersTableData, error: usersTableError } = await supabase
          .from('users')
          .select('id, name, full_name, email')
          .in('id', memberUserIds)

        profilesData = usersTableData || []

        if (usersTableError) {
          console.warn('Failed to load member profiles from profiles/users:', usersTableError)
        }
      }
    }

    const { data: familiesData, error: familiesError } = await supabase
      .from('families')
      .select('id, name, invite_code, created_at')
      .in('id', familyIds)

    if (familiesError) {
      // Keep rendering with family_id fallback when family detail is blocked by RLS.
      console.warn('Failed to load families detail:', familiesError)
    }

    const merged = (myMemberships || []).map((m: any) => {
      const found = (familiesData || []).find((f: any) => f.id === m.family_id)
      const familyMembers = (allFamilyMembers || [])
        .filter((fm: any) => fm.family_id === m.family_id)
        .map((fm: any) => {
          const profile = (profilesData || []).find((u: any) => u.id === fm.user_id)
          return {
            user_id: fm.user_id,
            role: fm.role || 'member',
            created_at: fm.created_at || null,
            name: profile?.name || profile?.full_name || null,
            email: emailByUserId.get(fm.user_id) || profile?.email || null,
          }
        })

      return {
        family_id: m.family_id,
        role: m.role || 'member',
        created_at: m.created_at || null,
        family: found || null,
        members: familyMembers,
      }
    })

    setFamilies(merged)
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
            <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">Akun pribadi & data family yang sudah join</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Data Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Email: <span className="font-medium">{user?.email || '-'}</span></p>
            <p>User ID: <span className="font-mono text-xs">{user?.id || '-'}</span></p>
            <p>Akun dibuat: <span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '-'}</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family yang Diikuti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {families.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum join family manapun.</p>
            )}

            {families.map((item: any) => (
              <div key={`${item.family_id}-${item.created_at || 'na'}`} className="rounded-md border p-3">
                <p className="font-semibold">{item.family?.name || `Family ${String(item.family_id).slice(0, 8)}`}</p>
                <p className="text-sm text-muted-foreground">Role: {item.role || 'member'}</p>
                <p className="text-sm text-muted-foreground">Invite Code: {item.family?.invite_code || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Joined at: {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                </p>

                <div className="mt-3 border-t pt-3">
                  <p className="text-sm font-medium">
                    Member yang sudah join ({item.members?.length || 0})
                  </p>
                  <div className="mt-2 space-y-2">
                    {(item.members || []).map((member: any) => (
                      <div key={`${member.user_id}-${member.created_at || 'na'}`} className="rounded-md bg-muted/40 px-3 py-2">
                        <p className="text-sm font-medium">
                          {member.name || `User ${String(member.user_id).slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email || 'Email tidak tersedia'}
                        </p>
                      </div>
                    ))}

                    {(item.members || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">Belum ada member lain yang join.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
