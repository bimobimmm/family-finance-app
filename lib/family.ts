import { createClient } from '@/lib/supabase/client'

export async function createFamily(name: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1️⃣ Create family
  const { data: family, error } = await supabase
    .from('families')
    .insert({
      name,
      invite_code: crypto.randomUUID().slice(0, 6).toUpperCase(),
    })
    .select()
    .single()

  if (error) throw error

  // 2️⃣ Join as member
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
    })

  if (memberError) throw memberError

  return family
}

export async function joinFamily(inviteCode: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1️⃣ Find family
  const { data: family, error } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  if (error || !family) throw new Error('Invalid invite code')

  // 2️⃣ Join
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
    })

  if (memberError) throw memberError

  return family
}