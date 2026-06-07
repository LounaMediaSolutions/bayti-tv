import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadDevices, type Device } from "@/lib/bayti-store";
import { TvDisplay } from "@/components/TvDisplay";

export const Route = createFileRoute("/display")({
  validateSearch: (s: Record<string, unknown>) => ({
    device: typeof s.device === "string" ? s.device : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Bayti TV Display" },
      { name: "description", content: "Bayti guest welcome TV display." },
    ],
  }),
  component: DisplayPage,
});

function DisplayPage() {
  const { device: deviceId } = Route.useSearch();
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    const sync = () => {
      const all = loadDevices();
      setDevice(all.find((d) => d.id === deviceId) ?? all[0] ?? null);
    };
    sync();
    const i = setInterval(sync, 2000);
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(i);
      window.removeEventListener("storage", sync);
    };
  }, [deviceId]);

  return <TvDisplay device={device} />;
}
