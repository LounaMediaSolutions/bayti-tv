CREATE TABLE public.door_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  device_label text,
  device_model text NOT NULL DEFAULT 'ZKTeco ML300',
  code_length int NOT NULL DEFAULT 6,
  validity_hours int NOT NULL DEFAULT 24,
  default_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guest_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  guest_name text NOT NULL,
  checkin_date date,
  checkout_date date,
  door_code text,
  code_valid_from timestamptz,
  code_valid_until timestamptz,
  status text NOT NULL DEFAULT 'upcoming',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX guest_checkins_device_idx ON public.guest_checkins(device_id);
CREATE INDEX guest_checkins_status_idx ON public.guest_checkins(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_settings TO anon, authenticated;
GRANT ALL ON public.door_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_checkins TO anon, authenticated;
GRANT ALL ON public.guest_checkins TO service_role;

ALTER TABLE public.door_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_checkins ENABLE ROW LEVEL SECURITY;

-- TEMPORARY open policies — replace with auth-gated policies once admin sign-in is added.
CREATE POLICY "Open read door_settings" ON public.door_settings FOR SELECT USING (true);
CREATE POLICY "Open write door_settings" ON public.door_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open read guest_checkins" ON public.guest_checkins FOR SELECT USING (true);
CREATE POLICY "Open write guest_checkins" ON public.guest_checkins FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER door_settings_set_updated_at
  BEFORE UPDATE ON public.door_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER guest_checkins_set_updated_at
  BEFORE UPDATE ON public.guest_checkins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();