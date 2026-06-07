import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadDevices, T, type Device } from "@/lib/bayti-store";
import { BaytiLogo } from "@/components/BaytiLogo";

export const Route = createFileRoute("/guest")({
  head: () => ({
    meta: [
      { title: "Bayti — Guest Welcome" },
      { name: "description", content: "Your stay info: Wi-Fi, door code, and direct contact." },
    ],
  }),
  component: GuestPage,
});

function GuestPage() {
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    const devices = loadDevices();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    setDevice(devices.find((d) => d.id === id) || devices[0] || null);
  }, []);

  if (!device) {
    return (
      <main style={pageStyle}>
        <p style={{ opacity: 0.7 }}>Loading…</p>
      </main>
    );
  }

  const lang = device.language || "en";
  const t = T[lang];
  const rtl = lang === "ar";
  const phone = (device.supportPhone || "").replace(/\s+/g, "");
  const waNumber = phone.replace(/[^\d]/g, "");

  return (
    <main dir={rtl ? "rtl" : "ltr"} style={pageStyle}>
      <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BaytiLogo color="#eef3f6" height={36} />
          <span style={{ fontSize: 13, opacity: 0.7 }}>{device.propertyName}</span>
        </header>

        <section style={cardStyle}>
          <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: TEAL }}>
            {t.welcome}
          </div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 40, margin: "6px 0 8px", lineHeight: 1.05 }}>
            {device.guestName || "—"}
          </h1>
          <p style={{ opacity: 0.82, margin: 0 }}>{device.welcomeMessage || t.enjoy}</p>
        </section>

        <section style={cardStyle}>
          <Label>{t.wifi}</Label>
          <Row k={t.network} v={device.wifiSsid} />
          <Row k={t.password} v={device.wifiPassword} mono />
        </section>

        {device.doorCode && (
          <section style={{ ...cardStyle, borderColor: `${TEAL}55`, background: `linear-gradient(90deg, ${TEAL}22 0%, rgba(255,255,255,.04) 100%)` }}>
            <Label>{t.door}</Label>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 44, fontWeight: 700, letterSpacing: 6, color: TEAL, lineHeight: 1 }}>
              {device.doorCode}
            </div>
            {device.doorNote && <div style={{ marginTop: 8, opacity: 0.82 }}>{device.doorNote}</div>}
          </section>
        )}

        <section style={cardStyle}>
          <Label>{t.help}</Label>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{device.supportPhone}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <CommBtn href={`tel:${phone}`} label="Call" />
            <CommBtn href={`sms:${phone}`} label="SMS" />
            <CommBtn href={`https://wa.me/${waNumber}`} label="WhatsApp" external />
            <CommBtn href={`mailto:support@bayti.vip`} label="Email" />
          </div>
        </section>

        {device.recommendations?.length > 0 && (
          <section style={cardStyle}>
            <Label>{t.recs}</Label>
            <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
              {device.recommendations.map((r, i) => (
                <div key={i} style={{ borderInlineStart: `2px solid ${TEAL}`, paddingInlineStart: 12 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ opacity: 0.7, fontSize: 14 }}>{r.note}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={{ textAlign: "center", opacity: 0.5, fontSize: 12, padding: "12px 0" }}>
          {t.checkout}: {device.checkout}
        </footer>
      </div>
    </main>
  );
}

const TEAL = "#11c6bf";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(120% 120% at 80% -10%, #18243a 0%, #101929 50%, #0a0f1a 100%)",
  color: "#eef3f6",
  fontFamily: "Outfit, system-ui, sans-serif",
  padding: 20,
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 16,
  padding: 20,
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v?: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
      <span style={{ opacity: 0.6 }}>{k}</span>
      <span style={{ fontWeight: 600, fontFamily: mono ? "ui-monospace, monospace" : "inherit" }}>{v}</span>
    </div>
  );
}

function CommBtn({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      style={{
        background: TEAL,
        color: "#101929",
        textAlign: "center",
        padding: "12px 14px",
        borderRadius: 10,
        fontWeight: 700,
        textDecoration: "none",
        fontSize: 14,
      }}
    >
      {label}
    </a>
  );
}
