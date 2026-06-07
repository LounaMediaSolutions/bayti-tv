import { createFileRoute, Link } from "@tanstack/react-router";
import { BaytiLogo } from "@/components/BaytiLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bayti TV — Welcome screens & smart door codes" },
      {
        name: "description",
        content:
          "Manage in-apartment TV welcome screens and smart door codes for Bayti.vip guests.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(120% 120% at 80% -10%, #18243a 0%, #101929 50%, #0a0f1a 100%)",
        color: "#eef3f6",
        fontFamily: "Outfit, system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 720, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <BaytiLogo color="#eef3f6" height={72} />
        </div>
        <h1
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            fontWeight: 600,
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          Welcome screens & smart door codes
        </h1>
        <p style={{ opacity: 0.75, fontSize: 17, marginBottom: 32, lineHeight: 1.5 }}>
          Manage every TV in your Bayti.vip apartments, and share the ZKTeco ML300
          door PIN with each guest — all from one place.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/admin"
            style={{
              background: "#11c6bf",
              color: "#101929",
              padding: "14px 24px",
              borderRadius: 12,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Open Admin →
          </Link>
          <Link
            to="/display"
            style={{
              border: "1px solid rgba(255,255,255,.25)",
              color: "#eef3f6",
              padding: "14px 24px",
              borderRadius: 12,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Preview TV /display
          </Link>
          <Link
            to="/rentals"
            style={{
              border: "1px solid rgba(255,255,255,.25)",
              color: "#eef3f6",
              padding: "14px 24px",
              borderRadius: 12,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Rentals & Extras
          </Link>
        </div>
      </div>
    </main>
  );
}
