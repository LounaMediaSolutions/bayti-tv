import type { CapacitorConfig } from "@capacitor/cli";

// Bayti TV launcher — Capacitor config for Thomson Android TV (Android 11).
// The WebView loads the live Lovable app at /tv so admin changes appear
// instantly on the TV without rebuilding the APK.
//
// 👉 BEFORE BUILDING: replace `server.url` below with YOUR published URL,
//    e.g. https://bayti.lovable.app/tv  (after you click Publish in Lovable).

const config: CapacitorConfig = {
  appId: "app.bayti.tv",
  appName: "Bayti TV",
  webDir: "dist",
  server: {
    url: "https://bayti-welcome-kit.lovable.app/tv",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0a0f1a",
  },
};

export default config;
