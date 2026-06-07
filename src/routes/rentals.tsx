import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BaytiLogo } from "@/components/BaytiLogo";

export const Route = createFileRoute("/rentals")({
  head: () => ({
    meta: [
      { title: "Rentals & Extras — Bayti.vip" },
      {
        name: "description",
        content:
          "Add-ons for your Bayti.vip stay: 4G Wi‑Fi modem, baby cot, high chair, car seat, beach kit and more.",
      },
      { property: "og:title", content: "Rentals & Extras — Bayti.vip" },
      {
        property: "og:description",
        content:
          "Pick the extras you need — 4G modem, baby cot, high chair, car seat, beach kit — delivered to your apartment.",
      },
    ],
  }),
  component: RentalsPage,
});

type Extra = {
  id: string;
  name: string;
  emoji: string;
  price: number; // DZD per day
  unit: string;
  desc: string;
};

const EXTRAS: Extra[] = [
  { id: "modem", name: "Portable 4G Wi‑Fi modem", emoji: "📶", price: 600, unit: "/day", desc: "Unlimited 4G internet you can carry around the city or to the beach." },
  { id: "cot", name: "Baby cot", emoji: "🛏️", price: 400, unit: "/day", desc: "Safe wooden cot with clean mattress and sheets, set up before arrival." },
  { id: "highchair", name: "High chair", emoji: "🍼", price: 250, unit: "/day", desc: "Stable high chair for meals, easy to clean." },
  { id: "carseat", name: "Baby car seat", emoji: "🚗", price: 500, unit: "/day", desc: "Group 0+/1 car seat, suitable from birth to ~4 years." },
  { id: "stroller", name: "Stroller", emoji: "👶", price: 450, unit: "/day", desc: "Lightweight foldable stroller, perfect for the corniche." },
  { id: "beach", name: "Beach kit", emoji: "🏖️", price: 700, unit: "/day", desc: "Parasol, 2 chairs, cooler bag and towels." },
  { id: "bbq", name: "BBQ kit", emoji: "🔥", price: 900, unit: "/use", desc: "Charcoal BBQ, tongs, plates and starter charcoal." },
  { id: "airport", name: "Airport pickup", emoji: "✈️", price: 2500, unit: "/trip", desc: "Private driver from Soummam Airport to your apartment." },
  { id: "groceries", name: "Welcome groceries", emoji: "🛒", price: 1500, unit: "/basket", desc: "Bread, water, coffee, milk, fruit — ready when you arrive." },
  { id: "cleaning", name: "Mid‑stay cleaning", emoji: "🧹", price: 2000, unit: "/visit", desc: "Full cleaning and fresh linen change during your stay." },
];

function RentalsPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [days, setDays] = useState(3);
  const [name, setName] = useState("");
  const [apt, setApt] = useState("");

  const toggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const chosen = useMemo(() => EXTRAS.filter((e) => selected[e.id]), [selected]);

  const total = useMemo(
    () =>
      chosen.reduce((sum, e) => {
        const mult = e.unit === "/day" ? days : 1;
        return sum + e.price * mult;
      }, 0),
    [chosen, days]
  );

  const waMessage = useMemo(() => {
    const lines = [
      `Hello Bayti.vip 👋`,
      name ? `Guest: ${name}` : null,
      apt ? `Apartment: ${apt}` : null,
      `Stay length: ${days} day${days > 1 ? "s" : ""}`,
      ``,
      `I'd like to add these extras:`,
      ...chosen.map(
        (e) =>
          `• ${e.name} — ${e.price.toLocaleString()} DZD${e.unit}${
            e.unit === "/day" ? ` × ${days} = ${(e.price * days).toLocaleString()} DZD` : ""
          }`
      ),
      ``,
      `Estimated total: ${total.toLocaleString()} DZD`,
    ].filter(Boolean);
    return encodeURIComponent(lines.join("\n"));
  }, [chosen, days, total, name, apt]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(120% 120% at 80% -10%, #18243a 0%, #101929 50%, #0a0f1a 100%)",
        color: "#eef3f6",
        fontFamily: "Outfit, system-ui, sans-serif",
        padding: "32px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Link to="/" style={{ display: "inline-flex", textDecoration: "none" }}>
            <BaytiLogo color="#eef3f6" height={40} />
          </Link>
          <nav style={{ display: "flex", gap: 16, fontSize: 14, opacity: 0.85 }}>
            <Link to="/" style={{ color: "#eef3f6", textDecoration: "none" }}>Home</Link>
            <Link to="/admin" style={{ color: "#eef3f6", textDecoration: "none" }}>Admin</Link>
            <Link to="/display" style={{ color: "#eef3f6", textDecoration: "none" }}>Display</Link>
          </nav>
        </header>

        <section style={{ textAlign: "center", marginBottom: 40 }}>
          <p
            style={{
              color: "#11c6bf",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Rentals & Extras
          </p>
          <h1
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Everything you need for a comfortable stay
          </h1>
          <p style={{ opacity: 0.75, fontSize: 16, maxWidth: 620, margin: "0 auto" }}>
            Pick what you need — we deliver and set it up in your apartment before you
            arrive. Pay on arrival in cash or by card.
          </p>
        </section>

        {/* Controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Field label="Your name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karim"
              style={inputStyle}
            />
          </Field>
          <Field label="Apartment / booking">
            <input
              value={apt}
              onChange={(e) => setApt(e.target.value)}
              placeholder="e.g. Bayti #101"
              style={inputStyle}
            />
          </Field>
          <Field label={`Stay length: ${days} day${days > 1 ? "s" : ""}`}>
            <input
              type="range"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </Field>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {EXTRAS.map((e) => {
            const isOn = !!selected[e.id];
            return (
              <button
                key={e.id}
                onClick={() => toggle(e.id)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 16,
                  padding: 18,
                  background: isOn
                    ? "linear-gradient(160deg, rgba(17,198,191,.18), rgba(17,198,191,.06))"
                    : "rgba(255,255,255,0.04)",
                  border: isOn
                    ? "1px solid #11c6bf"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: "#eef3f6",
                  transition: "all .15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 32 }}>{e.emoji}</span>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,.3)",
                      background: isOn ? "#11c6bf" : "transparent",
                      color: "#101929",
                      fontSize: 14,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isOn ? "✓" : ""}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{e.name}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12, lineHeight: 1.4 }}>{e.desc}</div>
                <div style={{ fontSize: 14, color: "#11c6bf", fontWeight: 700 }}>
                  {e.price.toLocaleString()} DZD <span style={{ opacity: 0.7, fontWeight: 500 }}>{e.unit}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 24, margin: 0 }}>
              Your selection ({chosen.length})
            </h2>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#11c6bf" }}>
              {total.toLocaleString()} DZD
            </div>
          </div>

          {chosen.length === 0 ? (
            <p style={{ opacity: 0.6, margin: 0 }}>Tap any item above to add it to your order.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {chosen.map((e) => {
                const mult = e.unit === "/day" ? days : 1;
                return (
                  <li
                    key={e.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      fontSize: 14,
                    }}
                  >
                    <span>{e.emoji} {e.name}{e.unit === "/day" ? ` × ${days}d` : ""}</span>
                    <span style={{ fontWeight: 700 }}>{(e.price * mult).toLocaleString()} DZD</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href={`https://wa.me/213000000000?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: chosen.length ? "#11c6bf" : "rgba(255,255,255,.1)",
                color: "#101929",
                padding: "14px 22px",
                borderRadius: 12,
                fontWeight: 700,
                textDecoration: "none",
                pointerEvents: chosen.length ? "auto" : "none",
                opacity: chosen.length ? 1 : 0.5,
                fontSize: 15,
              }}
            >
              Request on WhatsApp →
            </a>
            <button
              onClick={() => setSelected({})}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,.2)",
                color: "#eef3f6",
                padding: "14px 22px",
                borderRadius: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              Clear
            </button>
          </div>

          <p style={{ fontSize: 12, opacity: 0.55, margin: 0 }}>
            Prices are indicative. Final pricing confirmed by your host on WhatsApp.
            Delivery within Béjaïa city is free for stays of 2+ nights.
          </p>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,.25)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#eef3f6",
  fontSize: 14,
  fontFamily: "inherit",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>
        {label}
      </span>
      {children}
    </label>
  );
}
