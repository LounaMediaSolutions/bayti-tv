import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LANGS,
  loadDevices,
  newDevice,
  saveDevices,
  type Device,
  type Lang,
  type LauncherApp,
  type Partner,
  type Notice,
} from "@/lib/bayti-store";
import { BaytiLogo } from "@/components/BaytiLogo";
import { TvDisplay } from "@/components/TvDisplay";
import { DoorAdmin } from "@/components/DoorAdmin";

const NAVY = "#101929";
const TEAL = "#11c6bf";
const PAPER = "#f4f6f8";
const CARD = "#ffffff";
const LINE = "rgba(16,25,41,0.12)";
const SUB = "rgba(16,25,41,0.60)";
const ONDARK = "#eef3f6";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Bayti TV Manager" },
      { name: "description", content: "Manage Bayti TV welcome screens and guest door codes." },
    ],
  }),
  component: AdminPage,
});

function Field({
  label,
  value,
  onChange,
  mono,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  mono?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span
        style={{
          fontSize: 12,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: SUB,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg outline-none"
        style={{
          border: `1px solid ${LINE}`,
          background: CARD,
          color: NAVY,
          fontFamily: mono ? "ui-monospace,monospace" : "inherit",
        }}
      />
    </label>
  );
}

function AdminPage() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"admin" | "display">("admin");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = loadDevices();
    setDevices(d);
    setSelectedId(d[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (!devices) return;
    setSaving(true);
    const t = setTimeout(() => {
      saveDevices(devices);
      setSaving(false);
    }, 300);
    return () => clearTimeout(t);
  }, [devices]);

  if (!devices)
    return (
      <div style={{ padding: 24, color: NAVY, fontFamily: "Outfit, sans-serif" }}>Loading…</div>
    );

  const d = devices.find((x) => x.id === selectedId) ?? devices[0];
  const update = (p: Partial<Device>) =>
    setDevices(devices.map((x) => (x.id === d.id ? { ...x, ...p } : x)));
  const updateRec = (i: number, p: Partial<{ name: string; note: string }>) =>
    update({
      recommendations: d.recommendations.map((r, j) => (j === i ? { ...r, ...p } : r)),
    });
  const addRec = () =>
    update({ recommendations: [...(d.recommendations || []), { name: "", note: "" }] });
  const delRec = (i: number) =>
    update({ recommendations: d.recommendations.filter((_, j) => j !== i) });

  // ---- Launcher: apps / partners / notices / screensaver ----
  const updateApp = (i: number, p: Partial<LauncherApp>) =>
    update({ apps: d.apps.map((a, j) => (j === i ? { ...a, ...p } : a)) });
  const addApp = () =>
    update({ apps: [...d.apps, { name: "", pkg: "" }] });
  const delApp = (i: number) =>
    update({ apps: d.apps.filter((_, j) => j !== i) });

  const updatePartner = (i: number, p: Partial<Partner>) =>
    update({ partners: d.partners.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const addPartner = () =>
    update({ partners: [...d.partners, { name: "", category: "" }] });
  const delPartner = (i: number) =>
    update({ partners: d.partners.filter((_, j) => j !== i) });

  const addNotice = () => {
    const n: Notice = {
      id: Math.random().toString(36).slice(2),
      title: "",
      createdAt: Date.now(),
    };
    update({ notices: [n, ...d.notices] });
  };
  const updateNotice = (i: number, p: Partial<Notice>) =>
    update({ notices: d.notices.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const delNotice = (i: number) =>
    update({ notices: d.notices.filter((_, j) => j !== i) });

  const addPhoto = (url: string) => {
    if (!url.trim()) return;
    update({ screensaverPhotos: [...d.screensaverPhotos, url.trim()] });
  };
  const delPhoto = (i: number) =>
    update({ screensaverPhotos: d.screensaverPhotos.filter((_, j) => j !== i) });

  // Around house & things to see
  const updateAround = (i: number, p: Partial<{ label: string; detail: string }>) =>
    update({ aroundHouse: d.aroundHouse.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const addAround = () =>
    update({ aroundHouse: [...d.aroundHouse, { label: "", detail: "" }] });
  const delAround = (i: number) =>
    update({ aroundHouse: d.aroundHouse.filter((_, j) => j !== i) });

  const updateSee = (i: number, p: Partial<{ label: string; detail: string }>) =>
    update({ thingsToSee: d.thingsToSee.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const addSee = () =>
    update({ thingsToSee: [...d.thingsToSee, { label: "", detail: "" }] });
  const delSee = (i: number) =>
    update({ thingsToSee: d.thingsToSee.filter((_, j) => j !== i) });
  const addDevice = () => {
    const nd = newDevice();
    setDevices([...devices, nd]);
    setSelectedId(nd.id);
  };
  const delDevice = () => {
    if (devices.length <= 1) return;
    const rest = devices.filter((x) => x.id !== d.id);
    setDevices(rest);
    setSelectedId(rest[0].id);
  };
  const generateCode = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    update({ doorCode: code });
  };
  const copyCode = async () => {
    if (!d.doorCode) return;
    try {
      await navigator.clipboard.writeText(d.doorCode);
    } catch {
      // ignore
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: PAPER,
        padding: 24,
        fontFamily: "Outfit, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 18, flexWrap: "wrap", gap: 12 }}
        >
          <div className="flex items-center" style={{ gap: 12 }}>
            <BaytiLogo color={NAVY} height={40} />
            <div style={{ borderInlineStart: `1px solid ${LINE}`, paddingInlineStart: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>TV Manager</div>
              <div style={{ fontSize: 12, color: SUB }}>
                {saving ? "Saving…" : "All changes saved"}
              </div>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              className="flex"
              style={{
                gap: 6,
                background: CARD,
                padding: 4,
                borderRadius: 12,
                border: `1px solid ${LINE}`,
              }}
            >
              {(["admin", "display"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    background: mode === m ? NAVY : "transparent",
                    color: mode === m ? ONDARK : NAVY,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {m === "display" ? "TV Preview" : "Admin"}
                </button>
              ))}
            </div>
            <Link
              to="/display"
              search={{ device: d.id }}
              target="_blank"
              style={{ fontSize: 13, color: NAVY, textDecoration: "underline" }}
            >
              /display ↗
            </Link>
            <Link
              to="/tv"
              search={{ device: d.id }}
              target="_blank"
              style={{
                fontSize: 13,
                color: NAVY,
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              /tv launcher ↗
            </Link>
          </div>
        </div>

        {mode === "admin" ? (
          <div
            className="flex"
            style={{ gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}
          >
            <div style={{ width: 240, flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: SUB,
                  marginBottom: 8,
                }}
              >
                TVs / Devices
              </div>
              <div className="space-y-1">
                {devices.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setSelectedId(x.id)}
                    className="w-full text-left px-3 py-2 rounded-lg"
                    style={{
                      background: x.id === d.id ? NAVY : CARD,
                      color: x.id === d.id ? ONDARK : NAVY,
                      border: `1px solid ${LINE}`,
                      fontSize: 14,
                      cursor: "pointer",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{x.propertyName}</div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.6,
                        fontFamily: "ui-monospace,monospace",
                      }}
                    >
                      {x.id}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={addDevice}
                className="w-full mt-2 px-3 py-2 rounded-lg"
                style={{
                  border: `1px dashed ${TEAL}`,
                  color: "#0c8f8a",
                  fontSize: 13,
                  background: "#11c6bf12",
                  cursor: "pointer",
                }}
              >
                + Add TV
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 320 }}>
              <Section title="Property & Guest">
                <div className="grid grid-cols-2" style={{ gap: 14 }}>
                  <Field
                    label="Property name"
                    value={d.propertyName}
                    onChange={(v) => update({ propertyName: v })}
                  />
                  <Field
                    label="Guest name"
                    value={d.guestName}
                    onChange={(v) => update({ guestName: v })}
                    placeholder="Current guest"
                  />
                  <label className="block">
                    <span
                      style={{
                        fontSize: 12,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: SUB,
                      }}
                    >
                      Language
                    </span>
                    <select
                      value={d.language}
                      onChange={(e) => update({ language: e.target.value as Lang })}
                      className="w-full mt-1 px-3 py-2 rounded-lg"
                      style={{
                        border: `1px solid ${LINE}`,
                        background: CARD,
                        color: NAVY,
                      }}
                    >
                      {Object.entries(LANGS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Checkout time"
                    value={d.checkout}
                    onChange={(v) => update({ checkout: v })}
                    placeholder="11:00"
                  />
                </div>
              </Section>

              <Section title="Wi-Fi & Support">
                <div className="grid grid-cols-2" style={{ gap: 14 }}>
                  <Field
                    label="Wi-Fi network"
                    value={d.wifiSsid}
                    onChange={(v) => update({ wifiSsid: v })}
                  />
                  <Field
                    label="Wi-Fi password"
                    value={d.wifiPassword}
                    onChange={(v) => update({ wifiPassword: v })}
                    mono
                  />
                  <Field
                    label="Support phone"
                    value={d.supportPhone}
                    onChange={(v) => update({ supportPhone: v })}
                  />
                </div>
              </Section>

              <Section
                title="Smart door (ZKTeco ML300 · ZSmart app)"
                accent
                hint="Set the PIN in the ZSmart app, then enter the same code here so the guest sees it on the TV."
              >
                <div className="grid grid-cols-2" style={{ gap: 14 }}>
                  <div>
                    <label className="block">
                      <span
                        style={{
                          fontSize: 12,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          color: SUB,
                        }}
                      >
                        Door code (PIN)
                      </span>
                      <div className="flex" style={{ gap: 6, marginTop: 4 }}>
                        <input
                          value={d.doorCode ?? ""}
                          onChange={(e) => update({ doorCode: e.target.value })}
                          inputMode="numeric"
                          placeholder="e.g. 482915"
                          className="px-3 py-2 rounded-lg outline-none"
                          style={{
                            flex: 1,
                            border: `1px solid ${LINE}`,
                            background: CARD,
                            color: NAVY,
                            fontFamily: "ui-monospace,monospace",
                            fontSize: 18,
                            letterSpacing: 3,
                            fontWeight: 600,
                          }}
                        />
                        <button
                          type="button"
                          onClick={generateCode}
                          title="Generate random 6-digit code"
                          className="px-3 py-2 rounded-lg"
                          style={{
                            border: `1px solid ${LINE}`,
                            background: CARD,
                            color: NAVY,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          ⟳
                        </button>
                        <button
                          type="button"
                          onClick={copyCode}
                          title="Copy code"
                          className="px-3 py-2 rounded-lg"
                          style={{
                            border: `1px solid ${LINE}`,
                            background: CARD,
                            color: NAVY,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          ⧉
                        </button>
                      </div>
                    </label>
                  </div>
                  <Field
                    label="Note / instructions"
                    value={d.doorNote}
                    onChange={(v) => update({ doorNote: v })}
                    placeholder="e.g. Tapez le code puis #"
                  />
                  <Field
                    label="Valid from"
                    type="date"
                    value={d.doorCodeValidFrom}
                    onChange={(v) => update({ doorCodeValidFrom: v })}
                  />
                  <Field
                    label="Valid until"
                    type="date"
                    value={d.doorCodeValidUntil}
                    onChange={(v) => update({ doorCodeValidUntil: v })}
                  />
                </div>
                <p style={{ fontSize: 12, color: SUB, marginTop: 10, lineHeight: 1.5 }}>
                  The ZKTeco ML300 does not expose an open API for cloud PIN sync.
                  Workflow: open the <strong>ZSmart</strong> app → add a temporary user PIN
                  for the booking dates → paste the same PIN above. The TV will show it
                  to the guest automatically.
                </p>
              </Section>

              <Section
                title="Door management — cloud (device, code format, validity, per-guest codes)"
                accent
                hint="Settings + guest check-ins are stored in your backend so every TV stays in sync."
              >
                <DoorAdmin deviceId={d.id} deviceLabel={d.propertyName} />
              </Section>



              <Section title="Welcome message (optional)">
                <Field
                  label="Custom greeting"
                  value={d.welcomeMessage}
                  onChange={(v) => update({ welcomeMessage: v })}
                  placeholder="Leave empty for default greeting"
                />
              </Section>

              <Section title="Recommendations">
                <div className="space-y-2">
                  {(d.recommendations || []).map((r, i) => (
                    <div key={i} className="flex" style={{ gap: 8, marginBottom: 6 }}>
                      <input
                        value={r.name}
                        placeholder="Place"
                        onChange={(e) => updateRec(i, { name: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 1, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <input
                        value={r.note}
                        placeholder="Note"
                        onChange={(e) => updateRec(i, { note: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 1.4, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <button
                        onClick={() => delRec(i)}
                        style={{
                          color: "#b3463b",
                          paddingInline: 8,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addRec}
                  style={{
                    color: "#0c8f8a",
                    fontSize: 13,
                    marginTop: 6,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + Add recommendation
                </button>
              </Section>

              <Section
                title="TV Launcher — Authorized apps"
                accent
                hint="Apps shown on the TV home. Use the Android package name (e.g. com.netflix.ninja, com.google.android.youtube.tv)."
              >
                <div className="space-y-2">
                  {d.apps.map((a, i) => (
                    <div key={i} className="flex" style={{ gap: 8, marginBottom: 6 }}>
                      <input
                        value={a.name}
                        placeholder="Display name (Netflix)"
                        onChange={(e) => updateApp(i, { name: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 1, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <input
                        value={a.pkg}
                        placeholder="com.netflix.ninja"
                        onChange={(e) => updateApp(i, { pkg: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{
                          flex: 1.4,
                          border: `1px solid ${LINE}`,
                          color: NAVY,
                          fontFamily: "ui-monospace,monospace",
                          fontSize: 13,
                        }}
                      />
                      <input
                        value={a.icon ?? ""}
                        placeholder="Icon URL (optional)"
                        onChange={(e) => updateApp(i, { icon: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 1.2, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <button
                        onClick={() => delApp(i)}
                        style={{
                          color: "#b3463b",
                          paddingInline: 8,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addApp}
                  style={{
                    color: "#0c8f8a",
                    fontSize: 13,
                    marginTop: 6,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + Add app
                </button>
              </Section>

              <Section title="Partners (restaurants, agencies…)">
                <div className="space-y-2">
                  {d.partners.map((p, i) => (
                    <div key={i} className="flex" style={{ gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <input
                        value={p.name}
                        placeholder="Name"
                        onChange={(e) => updatePartner(i, { name: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 1, minWidth: 120, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <input
                        value={p.category}
                        placeholder="Category"
                        onChange={(e) => updatePartner(i, { category: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 0.8, minWidth: 100, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <input
                        value={p.note ?? ""}
                        placeholder="Note / offer"
                        onChange={(e) => updatePartner(i, { note: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 1.4, minWidth: 140, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <input
                        value={p.phone ?? ""}
                        placeholder="Phone"
                        onChange={(e) => updatePartner(i, { phone: e.target.value })}
                        className="px-3 py-2 rounded-lg"
                        style={{ flex: 0.8, minWidth: 110, border: `1px solid ${LINE}`, color: NAVY }}
                      />
                      <button
                        onClick={() => delPartner(i)}
                        style={{
                          color: "#b3463b",
                          paddingInline: 8,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addPartner}
                  style={{
                    color: "#0c8f8a",
                    fontSize: 13,
                    marginTop: 6,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + Add partner
                </button>
              </Section>

              <Section
                title="Notifications (shown on the TV)"
                hint="Title scrolls in the bottom bar. Body shows in the full notifications overlay."
              >
                <div className="space-y-2">
                  {d.notices.map((n, i) => (
                    <div
                      key={n.id}
                      style={{
                        border: `1px solid ${LINE}`,
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                        background: "#fafbfc",
                      }}
                    >
                      <div className="flex" style={{ gap: 8 }}>
                        <input
                          value={n.title}
                          placeholder="Title (e.g. Wi-Fi password updated)"
                          onChange={(e) => updateNotice(i, { title: e.target.value })}
                          className="px-3 py-2 rounded-lg"
                          style={{ flex: 1, border: `1px solid ${LINE}`, color: NAVY }}
                        />
                        <button
                          onClick={() => delNotice(i)}
                          style={{
                            color: "#b3463b",
                            paddingInline: 8,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        value={n.body ?? ""}
                        placeholder="Details (optional) — shown when the guest opens the notifications screen"
                        onChange={(e) => updateNotice(i, { body: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg mt-2"
                        style={{
                          border: `1px solid ${LINE}`,
                          background: CARD,
                          color: NAVY,
                          fontSize: 13,
                          resize: "vertical",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addNotice}
                  style={{
                    color: "#0c8f8a",
                    fontSize: 13,
                    marginTop: 6,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + Add notification
                </button>
              </Section>


              <Section title="Screensaver">
                <div className="grid grid-cols-2" style={{ gap: 14, marginBottom: 12 }}>
                  <Field
                    label="Idle delay (seconds)"
                    type="number"
                    value={String(d.screensaverDelaySec)}
                    onChange={(v) => update({ screensaverDelaySec: Math.max(10, Number(v) || 60) })}
                  />
                  <Field
                    label="Per-photo time (seconds)"
                    type="number"
                    value={String(d.screensaverIntervalSec)}
                    onChange={(v) => update({ screensaverIntervalSec: Math.max(2, Number(v) || 8) })}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  {d.screensaverPhotos.map((url, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        aspectRatio: "16 / 10",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: `1px solid ${LINE}`,
                        background: "#000",
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        onClick={() => delPhoto(i)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 999,
                          width: 24,
                          height: 24,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <PhotoAdder onAdd={addPhoto} />
              </Section>

              <Section title="House info (shown in the bottom 'House info' overlay)">
                <textarea
                  value={d.houseInfo}
                  onChange={(e) => update({ houseInfo: e.target.value })}
                  rows={6}
                  placeholder={"Trash day: Tuesday\nAC remote in the drawer\nNearby pharmacy: …"}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    border: `1px solid ${LINE}`,
                    background: CARD,
                    color: NAVY,
                    fontFamily: "inherit",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
              </Section>

              <Section title="Around the house (amenities, services)">
                <InfoLinkEditor
                  items={d.aroundHouse}
                  onUpdate={updateAround}
                  onAdd={addAround}
                  onDelete={delAround}
                  labelPlaceholder="e.g. Pharmacy"
                  detailPlaceholder="2 min walk, open 8–20"
                  addLabel="+ Add place around the house"
                />
              </Section>

              <Section title="Things to see & do nearby">
                <InfoLinkEditor
                  items={d.thingsToSee}
                  onUpdate={updateSee}
                  onAdd={addSee}
                  onDelete={delSee}
                  labelPlaceholder="e.g. Cap Carbon"
                  detailPlaceholder="20 min drive — sunset spot"
                  addLabel="+ Add attraction"
                />
              </Section>




              {devices.length > 1 && (
                <button
                  onClick={delDevice}
                  className="mt-5 px-3 py-2 rounded-lg"
                  style={{
                    border: "1px solid #b3463b55",
                    color: "#b3463b",
                    fontSize: 13,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Delete this TV
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center" style={{ gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: SUB }}>Showing TV:</span>
              <select
                value={d.id}
                onChange={(e) => setSelectedId(e.target.value)}
                className="px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${LINE}`, background: CARD, color: NAVY }}
              >
                {devices.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.propertyName} ({x.id})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: SUB }}>
                Exactly what the TV shows full-screen.
              </span>
            </div>
            <TvDisplay device={d} />
          </div>
        )}
      </div>
    </main>
  );
}

function PhotoAdder({ onAdd }: { onAdd: (url: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex" style={{ gap: 8 }}>
      <input
        value={v}
        placeholder="Paste image URL (https://…)"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(v);
            setV("");
          }
        }}
        className="px-3 py-2 rounded-lg"
        style={{ flex: 1, border: `1px solid ${LINE}`, color: NAVY }}
      />
      <button
        onClick={() => {
          onAdd(v);
          setV("");
        }}
        className="px-4 py-2 rounded-lg"
        style={{
          background: NAVY,
          color: ONDARK,
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Add photo
      </button>
    </div>
  );
}

function Section({
  title,
  children,
  hint,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <section
      style={{
        background: CARD,
        border: `1px solid ${accent ? TEAL + "55" : LINE}`,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        boxShadow: accent ? `0 0 0 3px ${TEAL}11` : "none",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: accent ? "#0c8f8a" : NAVY,
          marginBottom: hint ? 4 : 12,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </div>
      {hint && (
        <div style={{ fontSize: 12, color: SUB, marginBottom: 12 }}>{hint}</div>
      )}
      {children}
    </section>
  );
}

function InfoLinkEditor({
  items,
  onUpdate,
  onAdd,
  onDelete,
  labelPlaceholder,
  detailPlaceholder,
  addLabel,
}: {
  items: { label: string; detail?: string }[];
  onUpdate: (i: number, p: Partial<{ label: string; detail: string }>) => void;
  onAdd: () => void;
  onDelete: (i: number) => void;
  labelPlaceholder: string;
  detailPlaceholder: string;
  addLabel: string;
}) {
  return (
    <>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex" style={{ gap: 8, marginBottom: 6 }}>
            <input
              value={it.label}
              placeholder={labelPlaceholder}
              onChange={(e) => onUpdate(i, { label: e.target.value })}
              className="px-3 py-2 rounded-lg"
              style={{ flex: 1, border: `1px solid ${LINE}`, color: NAVY }}
            />
            <input
              value={it.detail ?? ""}
              placeholder={detailPlaceholder}
              onChange={(e) => onUpdate(i, { detail: e.target.value })}
              className="px-3 py-2 rounded-lg"
              style={{ flex: 1.6, border: `1px solid ${LINE}`, color: NAVY }}
            />
            <button
              onClick={() => onDelete(i)}
              style={{
                color: "#b3463b",
                paddingInline: 8,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        style={{
          color: "#0c8f8a",
          fontSize: 13,
          marginTop: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        {addLabel}
      </button>
    </>
  );
}

