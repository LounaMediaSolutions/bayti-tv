import type { Device } from "@/lib/bayti-store";
import { T } from "@/lib/bayti-store";
import { BaytiLogo } from "./BaytiLogo";

const NAVY = "#101929";
const NAVY_DEEP = "#0a0f1a";
const TEAL = "#11c6bf";
const ONDARK = "#eef3f6";

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      flex: 1,
      background: "rgba(255,255,255,.06)",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 14,
      padding: "1.6vw 1.8vw",
    }}
  >
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: "1vw",
      letterSpacing: 2,
      textTransform: "uppercase",
      opacity: 0.55,
      marginBottom: ".5vw",
    }}
  >
    {children}
  </div>
);

const Row = ({ k, v, mono }: { k: string; v?: string; mono?: boolean }) => (
  <div className="flex justify-between" style={{ fontSize: "1.35vw", marginTop: ".2vw" }}>
    <span style={{ opacity: 0.6 }}>{k}</span>
    <span
      style={{
        fontWeight: 600,
        fontFamily: mono ? "ui-monospace, monospace" : "inherit",
      }}
    >
      {v}
    </span>
  </div>
);

export function TvDisplay({ device }: { device: Device | null }) {
  if (!device)
    return (
      <div style={{ color: ONDARK, fontFamily: "Outfit, sans-serif" }}>No TV selected.</div>
    );
  const lang = device.language || "en";
  const t = T[lang];
  const rtl = lang === "ar";
  const fontFamily = rtl ? "Tajawal, Outfit, sans-serif" : "Outfit, system-ui, sans-serif";

  const validRange =
    device.doorCodeValidFrom || device.doorCodeValidUntil
      ? [device.doorCodeValidFrom, device.doorCodeValidUntil].filter(Boolean).join(" → ")
      : null;

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "16/9",
        color: ONDARK,
        fontFamily,
        borderRadius: 18,
        background: `radial-gradient(130% 130% at 82% -10%, #18243a 0%, ${NAVY} 48%, ${NAVY_DEEP} 100%)`,
        boxShadow: "0 30px 80px rgba(0,0,0,.4)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -70,
          width: 360,
          height: 360,
          background: TEAL,
          opacity: 0.14,
          filter: "blur(90px)",
          borderRadius: "50%",
        }}
      />
      <div className="relative h-full w-full" style={{ padding: "5% 6%" }}>
        <div className="flex items-center justify-between">
          <BaytiLogo color={ONDARK} height={42} wordmark={false} />
          <span style={{ fontSize: "1.1vw", opacity: 0.7 }}>{device.propertyName}</span>
        </div>

        <div style={{ marginTop: "2.5%" }}>
          <div
            style={{
              fontSize: "1.5vw",
              opacity: 0.8,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: TEAL,
            }}
          >
            {t.welcome}
          </div>
          <div
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "5.5vw",
              lineHeight: 1.02,
              fontWeight: 600,
            }}
          >
            {device.guestName || "—"}
          </div>
          <div style={{ fontSize: "1.35vw", marginTop: "1%", maxWidth: "72%", opacity: 0.82 }}>
            {device.welcomeMessage || t.enjoy}
          </div>
        </div>

        <div className="flex" style={{ gap: "2.5%", marginTop: "3%" }}>
          <Card>
            <Label>{t.wifi}</Label>
            <Row k={t.network} v={device.wifiSsid} />
            <Row k={t.password} v={device.wifiPassword} mono />
          </Card>
          <Card>
            <Label>{t.checkout}</Label>
            <div
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: "3.2vw",
                fontWeight: 600,
                color: TEAL,
              }}
            >
              {device.checkout}
            </div>
          </Card>
          <Card>
            <Label>{t.help}</Label>
            <div style={{ fontSize: "1.6vw", fontWeight: 500 }}>{device.supportPhone}</div>
          </Card>
        </div>

        {device.doorCode && (
          <div
            style={{
              marginTop: "2.5%",
              padding: "1.6vw 2vw",
              borderRadius: 16,
              border: `1px solid ${TEAL}55`,
              background: `linear-gradient(90deg, ${TEAL}22 0%, transparent 100%)`,
              display: "flex",
              alignItems: "center",
              gap: "2vw",
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <Label>{t.door}</Label>
              <div
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "4.2vw",
                  fontWeight: 700,
                  letterSpacing: "0.4vw",
                  color: TEAL,
                  lineHeight: 1,
                }}
              >
                {device.doorCode}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {device.doorNote && (
                <div style={{ fontSize: "1.2vw", opacity: 0.85 }}>{device.doorNote}</div>
              )}
              {validRange && (
                <div style={{ fontSize: "1vw", opacity: 0.6, marginTop: ".4vw" }}>
                  {t.valid}: {validRange}
                </div>
              )}
            </div>
          </div>
        )}

        {device.recommendations?.length > 0 && (
          <div style={{ marginTop: "2.2%" }}>
            <Label>{t.recs}</Label>
            <div className="flex" style={{ gap: "2%", marginTop: "1%" }}>
              {device.recommendations.slice(0, 3).map((r, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderInlineStart: `2px solid ${TEAL}`,
                    paddingInlineStart: "1.2%",
                  }}
                >
                  <div style={{ fontSize: "1.35vw", fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: "1vw", opacity: 0.68 }}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
