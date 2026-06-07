
-- 1. Roles system
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. door_settings: signed-in read, admin write
DROP POLICY IF EXISTS "Open read door_settings" ON public.door_settings;
DROP POLICY IF EXISTS "Open write door_settings" ON public.door_settings;

REVOKE ALL ON public.door_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_settings TO authenticated;
GRANT ALL ON public.door_settings TO service_role;

CREATE POLICY "Authenticated can read door_settings" ON public.door_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert door_settings" ON public.door_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update door_settings" ON public.door_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete door_settings" ON public.door_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. door_settings_audit: admin read, signed-in insert, no update/delete
DROP POLICY IF EXISTS "Open read door_settings_audit" ON public.door_settings_audit;
DROP POLICY IF EXISTS "Open insert door_settings_audit" ON public.door_settings_audit;

REVOKE ALL ON public.door_settings_audit FROM anon;
GRANT SELECT, INSERT ON public.door_settings_audit TO authenticated;
GRANT ALL ON public.door_settings_audit TO service_role;

CREATE POLICY "Admins can read audit" ON public.door_settings_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert audit" ON public.door_settings_audit
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 4. guest_checkins: signed-in read, admin write
DROP POLICY IF EXISTS "Open read guest_checkins" ON public.guest_checkins;
DROP POLICY IF EXISTS "Open write guest_checkins" ON public.guest_checkins;

REVOKE ALL ON public.guest_checkins FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_checkins TO authenticated;
GRANT ALL ON public.guest_checkins TO service_role;

CREATE POLICY "Authenticated can read guest_checkins" ON public.guest_checkins
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert guest_checkins" ON public.guest_checkins
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update guest_checkins" ON public.guest_checkins
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete guest_checkins" ON public.guest_checkins
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
