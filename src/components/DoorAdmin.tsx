import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type DoorAuditEntry,
  type DoorSettings,
  type GuestCheckin,
  deleteGuestCheckin,
  diffSettings,
  fetchDoorAudit,
  fetchDoorSettings,
  fetchGuestCheckins,
  generateCode,
  logDoorAudit,
  saveGuestCheckin,
  upsertDoorSettings,
} from "@/lib/door-data";

const ACTOR_KEY = "bayti.admin.actor";

const NAVY = "#101929";
const TEAL = "#11c6bf";
const CARD = "#ffffff";
const LINE = "rgba(16,25,41,0.12)";
const SUB = "rgba(16,25,41,0.60)";

interface Props {
  deviceId: string;
  deviceLabel: string;
}

const emptySettings = (deviceId: string, deviceLabel: string): DoorSettings => ({
  id: "",
  device_id: deviceId,
  device_label: deviceLabel,
  device_model: "ZKTeco ML300",
  code_length: 6,
  validity_hours: 24,
  default_note: "Type the code then press #",
});

export function DoorAdmin({ deviceId, deviceLabel }: Props) {
  const [settings, setSettings] = useState<DoorSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<DoorSettings | null>(null);
  const [checkins, setCheckins] = useState<GuestCheckin[]>([]);
  const [audit, setAudit] = useState<DoorAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actor, setActor] = useState<string>("");
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const seenAuditIds = useRef<Set<string>>(new Set());

  const pushToast = (text: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActor(window.localStorage.getItem(ACTOR_KEY) ?? "");
    }
  }, []);

  const updateActor = (name: string) => {
    setActor(name);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTOR_KEY, name);
    }
  };

  const reload = async () => {
    setLoading(true);
    try {
      const [s, list, log] = await Promise.all([
        fetchDoorSettings(deviceId),
        fetchGuestCheckins(deviceId),
        fetchDoorAudit(deviceId),
      ]);
      const resolved = s ?? emptySettings(deviceId, deviceLabel);
      setSettings(resolved);
      setSavedSettings(s ?? null);
      setCheckins(list);
      setAudit(log);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // Realtime: notify when door settings or audit entries change
  useEffect(() => {
    audit.forEach((a) => seenAuditIds.current.add(a.id));
  }, [audit]);

  useEffect(() => {
    const channel = supabase
      .channel(`door-admin-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "door_settings_audit",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const entry = payload.new as DoorAuditEntry;
          if (seenAuditIds.current.has(entry.id)) return;
          seenAuditIds.current.add(entry.id);
          setAudit((prev) => [entry, ...prev]);
          const fields =
            entry.changes && typeof entry.changes === "object"
              ? Object.keys(entry.changes).join(", ")
              : "";
          pushToast(
            `${entry.actor_name} ${entry.action.replace(/_/g, " ")}${
              fields ? ` — ${fields}` : ""
            }`,
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "door_settings",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const next = payload.new as DoorSettings;
          setSettings((cur) => (cur && cur.id === next.id ? next : cur));
          setSavedSettings(next);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [deviceId]);


  const saveSettings = async () => {
    if (!settings) return;
    if (!actor.trim()) {
      setError("Enter your name in the audit field before saving.");
      return;
    }
    setSavingSettings(true);
    try {
      const saved = await upsertDoorSettings({
        ...(settings.id ? { id: settings.id } : {}),
        device_id: settings.device_id,
        device_label: settings.device_label,
        device_model: settings.device_model,
        code_length: settings.code_length,
        validity_hours: settings.validity_hours,
        default_note: settings.default_note,
      });
      const changes = diffSettings(savedSettings, saved);
      if (Object.keys(changes).length > 0) {
        await logDoorAudit({
          device_id: deviceId,
          actor_name: actor.trim(),
          action: savedSettings ? "update_settings" : "create_settings",
          changes,
        });
        const log = await fetchDoorAudit(deviceId);
        setAudit(log);
      }
      setSettings(saved);
      setSavedSettings(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const addCheckin = async () => {
    if (!settings) return;
    const today = new Date().toISOString().slice(0, 10);
    const validUntil = new Date(
      Date.now() + settings.validity_hours * 3600 * 1000,
    ).toISOString();
    try {
      const created = await saveGuestCheckin({
        device_id: deviceId,
        guest_name: "New guest",
        checkin_date: today,
        checkout_date: null,
        door_code: generateCode(settings.code_length),
        code_valid_from: new Date().toISOString(),
        code_valid_until: validUntil,
        status: "upcoming",
        notes: null,
      });
      setCheckins([created, ...checkins]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add guest");
    }
  };

  const patchCheckin = async (c: GuestCheckin, p: Partial<GuestCheckin>) => {
    const next = { ...c, ...p };
    setCheckins((prev) => prev.map((x) => (x.id === c.id ? next : x)));
    try {
      await saveGuestCheckin(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const removeCheckin = async (id: string) => {
    setCheckins((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteGuestCheckin(id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const regenForGuest = (c: GuestCheckin) => {
    if (!settings) return;
    patchCheckin(c, {
      door_code: generateCode(settings.code_length),
      code_valid_from: new Date().toISOString(),
      code_valid_until: new Date(
        Date.now() + settings.validity_hours * 3600 * 1000,
      ).toISOString(),
    });
  };

  if (loading) return <p style={{ color: SUB, fontSize: 13 }}>Loading door data…</p>;
  if (!settings) return null;

  const labelStyle = {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: SUB,
  };
  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${LINE}`,
    background: CARD,
    color: NAVY,
    marginTop: 4,
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Live notifications */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 9999,
          maxWidth: 360,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: NAVY,
              color: "#eef3f6",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              borderLeft: `3px solid ${TEAL}`,
            }}
          >
            🔔 {t.text}
          </div>
        ))}
      </div>
      {error && (
        <div
          style={{
            background: "#fde8e6",
            border: "1px solid #f5b7b1",
            color: "#922b21",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Audit actor */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span style={{ ...labelStyle, marginRight: 4 }}>Signed in as</span>
        <input
          style={{ ...inputStyle, marginTop: 0, maxWidth: 260 }}
          value={actor}
          onChange={(e) => updateActor(e.target.value)}
          placeholder="Your name (recorded in audit log)"
        />
      </div>


      {/* Door settings */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
          Door settings (saved to cloud)
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}
        >
          <label>
            <span style={labelStyle}>Device label</span>
            <input
              style={inputStyle}
              value={settings.device_label ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, device_label: e.target.value })
              }
              placeholder="Front door — Apt 3"
            />
          </label>
          <label>
            <span style={labelStyle}>Device model</span>
            <input
              style={inputStyle}
              value={settings.device_model}
              onChange={(e) =>
                setSettings({ ...settings, device_model: e.target.value })
              }
            />
          </label>
          <label>
            <span style={labelStyle}>Code length (digits)</span>
            <input
              type="number"
              min={4}
              max={10}
              style={inputStyle}
              value={settings.code_length}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  code_length: Math.max(4, Math.min(10, Number(e.target.value) || 6)),
                })
              }
            />
          </label>
          <label>
            <span style={labelStyle}>Default validity (hours)</span>
            <input
              type="number"
              min={1}
              style={inputStyle}
              value={settings.validity_hours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  validity_hours: Math.max(1, Number(e.target.value) || 24),
                })
              }
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Default instructions</span>
            <input
              style={inputStyle}
              value={settings.default_note ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, default_note: e.target.value })
              }
              placeholder="Type the code then press #"
            />
          </label>
        </div>
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          style={{
            marginTop: 12,
            background: NAVY,
            color: "#eef3f6",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {savingSettings ? "Saving…" : "Save door settings"}
        </button>
      </div>

      {/* Guest check-ins */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
            Guest check-ins
          </div>
          <button
            onClick={addCheckin}
            style={{
              background: TEAL,
              color: NAVY,
              border: "none",
              padding: "6px 14px",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            + New check-in (auto code)
          </button>
        </div>

        {checkins.length === 0 ? (
          <p style={{ color: SUB, fontSize: 13 }}>
            No guests yet. Click "New check-in" to create one — a unique door code is
            generated for the validity window above.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {checkins.map((c) => (
              <div
                key={c.id}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  padding: 12,
                  background: "#fafbfc",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr 0.8fr auto",
                    gap: 8,
                    alignItems: "end",
                  }}
                >
                  <label>
                    <span style={labelStyle}>Guest</span>
                    <input
                      style={inputStyle}
                      value={c.guest_name}
                      onChange={(e) =>
                        patchCheckin(c, { guest_name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span style={labelStyle}>Check-in</span>
                    <input
                      type="date"
                      style={inputStyle}
                      value={c.checkin_date ?? ""}
                      onChange={(e) =>
                        patchCheckin(c, { checkin_date: e.target.value || null })
                      }
                    />
                  </label>
                  <label>
                    <span style={labelStyle}>Checkout</span>
                    <input
                      type="date"
                      style={inputStyle}
                      value={c.checkout_date ?? ""}
                      onChange={(e) =>
                        patchCheckin(c, { checkout_date: e.target.value || null })
                      }
                    />
                  </label>
                  <label>
                    <span style={labelStyle}>Door code</span>
                    <input
                      style={{
                        ...inputStyle,
                        fontFamily: "ui-monospace, monospace",
                        letterSpacing: 2,
                        fontWeight: 600,
                      }}
                      value={c.door_code ?? ""}
                      onChange={(e) =>
                        patchCheckin(c, { door_code: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span style={labelStyle}>Status</span>
                    <select
                      style={inputStyle}
                      value={c.status}
                      onChange={(e) => patchCheckin(c, { status: e.target.value })}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="past">Past</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => regenForGuest(c)}
                      title="Regenerate code"
                      style={{
                        background: "transparent",
                        border: `1px solid ${LINE}`,
                        padding: "8px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      ⟳
                    </button>
                    <button
                      onClick={() => removeCheckin(c.id)}
                      title="Delete"
                      style={{
                        background: "transparent",
                        border: `1px solid #f5b7b1`,
                        color: "#b3463b",
                        padding: "8px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: SUB, marginTop: 6 }}>
                  Code valid{" "}
                  {c.code_valid_from
                    ? new Date(c.code_valid_from).toLocaleString()
                    : "—"}{" "}
                  →{" "}
                  {c.code_valid_until
                    ? new Date(c.code_valid_until).toLocaleString()
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit log */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
          Door settings audit log
        </div>
        {audit.length === 0 ? (
          <p style={{ color: SUB, fontSize: 13 }}>
            No changes recorded yet. Edits to door settings will appear here with
            the editor's name and timestamp.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {audit.map((a) => (
              <div
                key={a.id}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  padding: 10,
                  background: "#fafbfc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: NAVY,
                    fontWeight: 600,
                  }}
                >
                  <span>
                    {a.actor_name} — {a.action.replace(/_/g, " ")}
                  </span>
                  <span style={{ color: SUB, fontWeight: 400 }}>
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                {a.changes && Object.keys(a.changes).length > 0 && (
                  <ul
                    style={{
                      margin: "6px 0 0",
                      paddingLeft: 18,
                      fontSize: 12,
                      color: SUB,
                    }}
                  >
                    {Object.entries(a.changes).map(([field, v]) => (
                      <li key={field}>
                        <strong style={{ color: NAVY }}>{field}</strong>:{" "}
                        {JSON.stringify(v.from)} → {JSON.stringify(v.to)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
