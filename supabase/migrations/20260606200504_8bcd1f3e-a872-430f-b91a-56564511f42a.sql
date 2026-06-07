CREATE TABLE public.door_settings_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  actor_name text NOT NULL,
  action text NOT NULL,
  changes jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.door_settings_audit TO anon;
GRANT SELECT, INSERT ON public.door_settings_audit TO authenticated;
GRANT ALL ON public.door_settings_audit TO service_role;

ALTER TABLE public.door_settings_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open read door_settings_audit" ON public.door_settings_audit
  FOR SELECT USING (true);
CREATE POLICY "Open insert door_settings_audit" ON public.door_settings_audit
  FOR INSERT WITH CHECK (true);

CREATE INDEX door_settings_audit_device_created_idx
  ON public.door_settings_audit (device_id, created_at DESC);