type ActivityLogInput = {
  actor_user_id: string
  action: 'create' | 'update' | 'delete'
  entity_type: 'transaction' | 'savings_target'
  entity_id: string
  scope: 'personal' | 'family'
  target_user_id?: string | null
  family_id?: string | null
  note?: string | null
}

export async function writeActivityLog(supabase: any, payload: ActivityLogInput) {
  const { error } = await supabase.from('activity_logs').insert([
    {
      actor_user_id: payload.actor_user_id,
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      scope: payload.scope,
      target_user_id: payload.target_user_id || null,
      family_id: payload.family_id || null,
      note: payload.note || null,
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.warn('Failed to write activity log:', error.message)
  }
}
