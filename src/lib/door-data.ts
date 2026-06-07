// Client-side data helpers for door settings + guest check-ins.
import { supabase } from "@/integrations/supabase/client";

export interface DoorSettings {
  id: string;
  device_id: string;
  device_label: string | null;
  device_model: string;
  code_length: number;
  validity_hours: number;
  default_note: string | null;
}

export interface GuestCheckin {
  id: string;
  device_id: string;
  guest_name: string;
  checkin_date: string | null;
  checkout_date: string | null;
  door_code: string | null;
  code_valid_from: string | null;
  code_valid_until: string | null;
  status: string;
  notes: string | null;
}

export async function fetchDoorSettings(deviceId: string): Promise<DoorSettings | null> {
  const { data, error } = await supabase
    .from("door_settings")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw error;
  return data as DoorSettings | null;
}

export async function upsertDoorSettings(s: Omit<DoorSettings, "id"> & { id?: string }) {
  const { data, error } = await supabase
    .from("door_settings")
    .upsert(s, { onConflict: "device_id" })
    .select()
    .single();
  if (error) throw error;
  return data as DoorSettings;
}

export async function fetchGuestCheckins(deviceId: string): Promise<GuestCheckin[]> {
  const { data, error } = await supabase
    .from("guest_checkins")
    .select("*")
    .eq("device_id", deviceId)
    .order("checkin_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as GuestCheckin[];
}

export async function saveGuestCheckin(c: Omit<GuestCheckin, "id"> & { id?: string }) {
  const { data, error } = await supabase
    .from("guest_checkins")
    .upsert(c)
    .select()
    .single();
  if (error) throw error;
  return data as GuestCheckin;
}

export async function deleteGuestCheckin(id: string) {
  const { error } = await supabase.from("guest_checkins").delete().eq("id", id);
  if (error) throw error;
}

export function generateCode(length: number): string {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(Math.floor(min + Math.random() * (max - min)));
}

export interface DoorAuditEntry {
  id: string;
  device_id: string;
  actor_name: string;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  created_at: string;
}

export async function fetchDoorAudit(
  deviceId: string,
  limit = 50,
): Promise<DoorAuditEntry[]> {
  const { data, error } = await supabase
    .from("door_settings_audit")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DoorAuditEntry[];
}

export async function logDoorAudit(entry: {
  device_id: string;
  actor_name: string;
  action: string;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
}) {
  const { error } = await supabase.from("door_settings_audit").insert({
    device_id: entry.device_id,
    actor_name: entry.actor_name || "Unknown",
    action: entry.action,
    changes: (entry.changes ?? null) as unknown as never,
  });
  if (error) throw error;
}

export function diffSettings(
  before: DoorSettings | null,
  after: DoorSettings,
): Record<string, { from: unknown; to: unknown }> {
  const keys: (keyof DoorSettings)[] = [
    "device_label",
    "device_model",
    "code_length",
    "validity_hours",
    "default_note",
  ];
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of keys) {
    const a = before ? before[k] : undefined;
    const b = after[k];
    if (a !== b) out[k as string] = { from: a ?? null, to: b ?? null };
  }
  return out;
}

