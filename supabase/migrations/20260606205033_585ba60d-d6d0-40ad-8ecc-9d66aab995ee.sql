
-- Re-open access for dev (no auth yet)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_settings_audit TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_checkins TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated can read door_settings" ON public.door_settings;
DROP POLICY IF EXISTS "Admins can insert door_settings" ON public.door_settings;
DROP POLICY IF EXISTS "Admins can update door_settings" ON public.door_settings;
DROP POLICY IF EXISTS "Admins can delete door_settings" ON public.door_settings;
CREATE POLICY "dev open door_settings" ON public.door_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read audit" ON public.door_settings_audit;
DROP POLICY IF EXISTS "Authenticated can insert audit" ON public.door_settings_audit;
CREATE POLICY "dev read audit" ON public.door_settings_audit FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "dev insert audit" ON public.door_settings_audit FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read guest_checkins" ON public.guest_checkins;
DROP POLICY IF EXISTS "Admins can insert guest_checkins" ON public.guest_checkins;
DROP POLICY IF EXISTS "Admins can update guest_checkins" ON public.guest_checkins;
DROP POLICY IF EXISTS "Admins can delete guest_checkins" ON public.guest_checkins;
CREATE POLICY "dev open guest_checkins" ON public.guest_checkins FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
