CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('transaction', 'savings_target')),
  entity_id UUID NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('personal', 'family')),
  target_user_id UUID NULL,
  family_id UUID NULL REFERENCES public.families(id) ON DELETE SET NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_target_user
  ON public.activity_logs(target_user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_family
  ON public.activity_logs(family_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view personal activity logs" ON public.activity_logs;
CREATE POLICY "Users can view personal activity logs" ON public.activity_logs
  FOR SELECT
  USING (
    scope = 'personal'
    AND target_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can view family activity logs" ON public.activity_logs;
CREATE POLICY "Users can view family activity logs" ON public.activity_logs
  FOR SELECT
  USING (
    scope = 'family'
    AND EXISTS (
      SELECT 1
      FROM public.family_members fm
      WHERE fm.family_id = activity_logs.family_id
      AND fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
  FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid()
  );
