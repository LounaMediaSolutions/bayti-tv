import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadDevices, T, type Device } from "@/lib/bayti-store";
import { BaytiLogo } from "@/components/BaytiLogo";

// Bayti TV Launcher — full-screen, remote-friendly UI.
// Intended to run as the default home/launcher on an Android TV (Thomson, etc.)
// via a Capacitor APK with CATEGORY_HOME + LEANBACK_LAUNCHER intent filters.

export const Route = createFileRoute("/tv")({
  validateSearch: (s: Record<string, unknown>) => ({
    device: typeof s.device === "string" ? s.device : undefined,
  }),
  component: TvLauncher,
});

const NAVY = "#0a0f1a";
const NAVY2 = "#18243a";
const TEAL = "#11c6bf";
const PAPER = "#eef3f6";
const SUB = "rgba(238,243,246,0.65)";
const CARD = "rgba(255,255,255,0.06)";
const LINE = "rgba(255,255,255,0.12)";

function TvLauncher() {
  const { device: deviceId } = Route.useSearch();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [showSaver, setShowSaver] = useState(false);
  const [saverIdx, setSaverIdx] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showNotices, setShowNotices] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDevices(loadDevices());
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const d = useMemo(() => {
    if (!devices) return null;
    return devices.find((x) => x.id === deviceId) ?? devices[0];
  }, [devices, deviceId]);

  // Idle → screensaver
  useEffect(() => {
    if (!d) return;
    const reset = () => {
      setShowSaver(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        if (d.screensaverPhotos.length > 0) setShowSaver(true);
      }, Math.max(10, d.screensaverDelaySec) * 1000);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [d]);

  // Cycle screensaver photos
  useEffect(() => {
    if (!showSaver || !d) return;
    const t = setInterval(
      () =>
        setSaverIdx((i) =>
          d.screensaverPhotos.length ? (i + 1) % d.screensaverPhotos.length : 0,
        ),
      Math.max(2, d.screensaverIntervalSec) * 1000,
    );
    return () => clearInterval(t);
  }, [showSaver, d]);

  if (!d) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: NAVY,
          color: PAPER,
          display: "grid",
          placeItems: "center",
          fontFamily: "Outfit, system-ui, sans-serif",
        }}
      >
        Loading…
      </div>
    );
  }

  const t = T[d.language];

  // Try to open an Android app via Capacitor AppLauncher (no-op on web).
  const openApp = async (pkg: string) => {
    try {
      const modName = "@capacitor/app-launcher";
      const importer = new Function("m", "return import(m)") as (
        m: string,
      ) => Promise<unknown>;
      const mod = (await importer(modName).catch(() => null)) as
        | { AppLauncher?: { openUrl: (o: { url: string }) => Promise<unknown> } }
        | null;
      if (mod?.AppLauncher) {
        await mod.AppLauncher.openUrl({ url: `android-app://${pkg}` });
        return;
      }
    } catch {
      // ignore
    }
    alert(`Would launch: ${pkg}\n(on the TV APK this opens the real app)`);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 600px at 20% 0%, ${NAVY2} 0%, ${NAVY} 60%)`,
        color: PAPER,
        fontFamily: "Outfit, system-ui, sans-serif",
        padding: "32px 48px 24px",
        position: "relative",
        overflow: "hidden",
      }}
      dir={d.language === "ar" ? "rtl" : "ltr"}
    >
      {/* Header: logo + clock */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <BaytiLogo color={PAPER} height={44} />
        <div style={{ textAlign: d.language === "ar" ? "left" : "right" }}>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 1 }}>
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: 13, color: SUB }}>
            {now.toLocaleDateString(d.language === "ar" ? "ar" : d.language, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>
      </div>

      {/* Row 1: Welcome */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 18, color: SUB, marginBottom: 6 }}>
          {t.welcome}
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.05 }}>
          {d.guestName || t.welcome} 👋
        </div>
        {d.welcomeMessage && (
          <div style={{ fontSize: 20, color: SUB, marginTop: 8 }}>
            {d.welcomeMessage}
          </div>
        )}
      </section>

      {/* Row 2: Authorized apps */}
      <RowSection title={d.language === "fr" ? "Applications" : d.language === "ar" ? "التطبيقات" : "Apps"}>
        {d.apps.length === 0 ? (
          <Empty text="No apps configured — add some in Admin" />
        ) : (
          <Rail>
            {d.apps.map((a) => (
              <Tile
                key={a.pkg}
                label={a.name}
                icon={a.icon}
                onClick={() => openApp(a.pkg)}
              />
            ))}
          </Rail>
        )}
      </RowSection>

      {/* Row 3: Partners */}
      <RowSection
        title={
          d.language === "fr"
            ? "Nos partenaires"
            : d.language === "ar"
              ? "شركاؤنا"
              : "Our partners"
        }
      >
        {d.partners.length === 0 ? (
          <Empty text="No partners yet" />
        ) : (
          <Rail>
            {d.partners.map((p, i) => (
              <Tile
                key={i}
                label={p.name}
                sub={p.category}
                icon={p.icon}
                accent
                onClick={() =>
                  alert(
                    `${p.name} · ${p.category}\n${p.note ?? ""}${p.phone ? `\n☎ ${p.phone}` : ""}`,
                  )
                }
              />
            ))}
          </Rail>
        )}
      </RowSection>

      {/* Bottom bar: notifications + info button */}
      <div
        style={{
          position: "absolute",
          insetInlineStart: 48,
          insetInlineEnd: 48,
          bottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <button
          onClick={() => d.notices.length > 0 && setShowNotices(true)}
          disabled={d.notices.length === 0}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "start",
            background: d.notices.length > 0 ? "rgba(17,198,191,0.08)" : "transparent",
            border: `1px solid ${d.notices.length > 0 ? TEAL + "44" : LINE}`,
            borderRadius: 999,
            padding: "10px 18px",
            color: PAPER,
            cursor: d.notices.length > 0 ? "pointer" : "default",
          }}
        >
          {d.notices.length === 0 ? (
            <span style={{ color: SUB, fontSize: 14 }}>
              🔔{" "}
              {d.language === "fr"
                ? "Aucune notification"
                : d.language === "ar"
                  ? "لا توجد إشعارات"
                  : "No notifications"}
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  background: TEAL,
                  color: NAVY,
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                🔔 {d.notices.length}
              </span>
              <NoticeTicker notices={d.notices.map((n) => n.title)} />
            </span>
          )}
        </button>
        <button
          onClick={() => setShowInfo(true)}
          style={{
            background: TEAL,
            color: NAVY,
            border: "none",
            padding: "12px 22px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ℹ︎{" "}
          {d.language === "fr"
            ? "Infos logement"
            : d.language === "ar"
              ? "معلومات السكن"
              : "House info"}
        </button>
        <button
          onClick={() => navigate({ to: "/admin" })}
          style={{
            background: "transparent",
            color: SUB,
            border: `1px solid ${LINE}`,
            padding: "10px 14px",
            borderRadius: 999,
            fontSize: 12,
            cursor: "pointer",
          }}
          title="Admin"
        >
          ⚙
        </button>
      </div>

      {/* Notifications overlay */}
      {showNotices && (
        <Overlay onClose={() => setShowNotices(false)}>
          <h2 style={{ fontSize: 32, marginTop: 0 }}>
            🔔{" "}
            {d.language === "fr"
              ? "Notifications"
              : d.language === "ar"
                ? "الإشعارات"
                : "Notifications"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.notices.map((n) => (
              <div
                key={n.id}
                style={{
                  background: CARD,
                  border: `1px solid ${LINE}`,
                  borderRadius: 14,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700 }}>{n.title}</div>
                {n.body && (
                  <div style={{ fontSize: 14, color: SUB, marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {n.body}
                  </div>
                )}
                <div style={{ fontSize: 11, color: SUB, marginTop: 8 }}>
                  {new Date(n.createdAt).toLocaleString(d.language === "ar" ? "ar" : d.language)}
                </div>
              </div>
            ))}
          </div>
        </Overlay>
      )}

      {/* House info overlay */}
      {showInfo && (
        <Overlay onClose={() => setShowInfo(false)}>
          <h2 style={{ fontSize: 32, marginTop: 0 }}>
            ℹ︎{" "}
            {d.language === "fr" ? "Infos logement" : d.language === "ar" ? "معلومات السكن" : "House info"}
          </h2>
          <InfoGrid d={d} />
          {d.houseInfo && (
            <InfoBlock
              title={
                d.language === "fr"
                  ? "Notes du logement"
                  : d.language === "ar"
                    ? "ملاحظات السكن"
                    : "House notes"
              }
            >
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: PAPER,
                  margin: 0,
                }}
              >
                {d.houseInfo}
              </pre>
            </InfoBlock>
          )}
          {d.aroundHouse.length > 0 && (
            <InfoBlock
              title={
                d.language === "fr"
                  ? "Autour de la maison"
                  : d.language === "ar"
                    ? "حول المنزل"
                    : "Around the house"
              }
            >
              <InfoList items={d.aroundHouse} />
            </InfoBlock>
          )}
          {d.thingsToSee.length > 0 && (
            <InfoBlock
              title={
                d.language === "fr"
                  ? "À voir & à faire"
                  : d.language === "ar"
                    ? "أماكن للزيارة"
                    : "Things to see & do"
              }
            >
              <InfoList items={d.thingsToSee} />
            </InfoBlock>
          )}
          {d.partners.length > 0 && (
            <InfoBlock
              title={
                d.language === "fr"
                  ? "Nos partenaires"
                  : d.language === "ar"
                    ? "شركاؤنا"
                    : "Our partners"
              }
            >
              <InfoList
                items={d.partners.map((p) => ({
                  label: `${p.name} · ${p.category}`,
                  detail: [p.note, p.phone].filter(Boolean).join(" · "),
                }))}
              />
            </InfoBlock>
          )}
        </Overlay>
      )}


      {/* Screensaver */}
      {showSaver && d.screensaverPhotos.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 50,
            display: "grid",
            placeItems: "center",
          }}
          onClick={() => setShowSaver(false)}
        >
          <img
            src={d.screensaverPhotos[saverIdx]}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.95,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 40,
              insetInlineStart: 48,
              color: "#fff",
              fontSize: 28,
              fontWeight: 600,
              textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            }}
          >
            {d.propertyName}
          </div>
        </div>
      )}
    </main>
  );
}

function RowSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 14,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: SUB,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        overflowX: "auto",
        paddingBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Tile({
  label,
  sub,
  icon,
  onClick,
  accent,
}: {
  label: string;
  sub?: string;
  icon?: string;
  onClick: () => void;
  accent?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <button
      onClick={onClick}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      onMouseEnter={() => setFocus(true)}
      onMouseLeave={() => setFocus(false)}
      style={{
        flex: "0 0 200px",
        height: 140,
        borderRadius: 16,
        background: accent
          ? `linear-gradient(135deg, ${TEAL}22, ${TEAL}05)`
          : CARD,
        border: `2px solid ${focus ? TEAL : LINE}`,
        color: PAPER,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: 14,
        textAlign: "start",
        transform: focus ? "scale(1.05)" : "scale(1)",
        transition: "all 120ms ease",
        boxShadow: focus ? `0 8px 24px ${TEAL}33` : "none",
        outline: "none",
      }}
    >
      {icon ? (
        <img
          src={icon}
          alt=""
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            marginBottom: "auto",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: accent ? TEAL : "rgba(255,255,255,0.08)",
            color: accent ? NAVY : PAPER,
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: "auto",
          }}
        >
          {label[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: SUB }}>{sub}</div>}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        height: 140,
        border: `2px dashed ${LINE}`,
        borderRadius: 16,
        display: "grid",
        placeItems: "center",
        color: SUB,
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function NoticeTicker({ notices }: { notices: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % notices.length), 5000);
    return () => clearInterval(t);
  }, [notices.length]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 15,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: 999,
          background: TEAL,
          flexShrink: 0,
        }}
      />
      <span style={{ color: PAPER }}>{notices[i]}</span>
    </div>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,8,15,0.85)",
        zIndex: 40,
        display: "grid",
        placeItems: "center",
        padding: 40,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: NAVY2,
          border: `1px solid ${LINE}`,
          borderRadius: 20,
          padding: 32,
          maxWidth: 900,
          width: "100%",
          color: PAPER,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            background: TEAL,
            color: NAVY,
            border: "none",
            padding: "10px 22px",
            borderRadius: 999,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function InfoGrid({ d }: { d: Device }) {
  const t = T[d.language];
  const items: [string, string][] = [
    [t.wifi, `${d.wifiSsid} · ${d.wifiPassword}`],
    [t.door, d.doorCode || "—"],
    [t.checkout, d.checkout || "—"],
    [t.help, d.supportPhone || "—"],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 14,
      }}
    >
      {items.map(([k, v]) => (
        <div
          key={k}
          style={{
            background: CARD,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: "14px 18px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              color: SUB,
            }}
          >
            {k}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              marginTop: 4,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: SUB,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoList({ items }: { items: { label: string; detail?: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            background: CARD,
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: PAPER }}>{it.label}</div>
          {it.detail && (
            <div style={{ fontSize: 13, color: SUB, marginTop: 2 }}>{it.detail}</div>
          )}
        </div>
      ))}
    </div>
  );
}
