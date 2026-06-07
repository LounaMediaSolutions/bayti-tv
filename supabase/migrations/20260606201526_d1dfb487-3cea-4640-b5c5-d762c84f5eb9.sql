ALTER TABLE public.door_settings REPLICA IDENTITY FULL;
ALTER TABLE public.door_settings_audit REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.door_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.door_settings_audit;