// Simple localStorage-backed store for Bayti TV devices.
// Each device represents one TV/apartment with guest info + smart door code.

export type Lang = "en" | "fr" | "ar";

export interface Recommendation {
  name: string;
  note: string;
}

export interface LauncherApp {
  name: string;
  // Android package name, e.g. "com.netflix.ninja"
  pkg: string;
  // Optional icon URL (https) — falls back to first letter tile
  icon?: string;
}

export interface Partner {
  name: string;
  category: string; // Restaurant, Agency, Taxi…
  note?: string;
  phone?: string;
  icon?: string;
}

export interface Notice {
  id: string;
  title: string;
  body?: string;
  createdAt: number;
}

export interface InfoLink {
  label: string;
  detail?: string;
}

export interface Device {
  id: string;
  propertyName: string;
  guestName: string;
  language: Lang;
  checkout: string;
  wifiSsid: string;
  wifiPassword: string;
  supportPhone: string;
  welcomeMessage: string;
  // Smart door (ZKTeco ML300 via ZSmart app)
  doorCode: string;
  doorCodeValidFrom?: string; // "YYYY-MM-DD"
  doorCodeValidUntil?: string;
  doorNote?: string; // extra instructions, e.g. "# after the code"
  recommendations: Recommendation[];
  // TV launcher
  apps: LauncherApp[];
  partners: Partner[];
  notices: Notice[];
  // Screensaver
  screensaverPhotos: string[]; // URLs
  screensaverDelaySec: number; // idle seconds before SS kicks in
  screensaverIntervalSec: number; // per-photo time
  houseInfo: string; // multi-line markdown-ish text shown on the info screen
  aroundHouse: InfoLink[]; // things in/around the house (pharmacy, ATM…)
  thingsToSee: InfoLink[]; // tourist spots, attractions
}

const STORAGE_KEY = "bayti:devices";

export const uid = () => "tv-" + Math.random().toString(36).slice(2, 7);

export const seedDevices: Device[] = [
  {
    id: "tv-101",
    propertyName: "Résidence Yemma — Apt 3",
    guestName: "Karim Benali",
    language: "fr",
    checkout: "11:00",
    wifiSsid: "Bayti_101",
    wifiPassword: "BejaiaSea2026",
    supportPhone: "+213 660 00 00 00",
    welcomeMessage: "",
    doorCode: "482915",
    doorCodeValidFrom: "",
    doorCodeValidUntil: "",
    doorNote: "Tapez le code puis appuyez sur #",
    recommendations: [
      { name: "Cap Carbon", note: "Vues sur la mer — 20 min" },
      { name: "Restaurant Le Phare", note: "Poisson frais, port de Béjaïa" },
      { name: "Plage des Aiguades", note: "Eau cristalline" },
    ],
    apps: [
      { name: "YouTube", pkg: "com.google.android.youtube.tv" },
      { name: "Netflix", pkg: "com.netflix.ninja" },
      { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom" },
      { name: "Spotify", pkg: "com.spotify.tv.android" },
    ],
    partners: [
      { name: "Le Phare", category: "Restaurant", note: "10% off for Bayti guests", phone: "+213 770 11 22 33" },
      { name: "Bejaia Tours", category: "Agency", note: "Cap Carbon day trip", phone: "+213 555 44 55 66" },
    ],
    notices: [],
    screensaverPhotos: [],
    screensaverDelaySec: 60,
    screensaverIntervalSec: 8,
    houseInfo: "Wi-Fi · Door code · Trash day: Tuesday\nCheckout 11:00 — leave keys on the table.",
    aroundHouse: [
      { label: "Pharmacy", detail: "Rue de la Liberté — 2 min walk" },
      { label: "Bakery", detail: "Open 6:00–20:00, corner shop" },
      { label: "ATM (BNA)", detail: "Across the street" },
    ],
    thingsToSee: [
      { label: "Cap Carbon lighthouse", detail: "20 min drive — sunset spot" },
      { label: "Yemma Gouraya National Park", detail: "Hiking, panoramic views" },
      { label: "Casbah of Béjaïa", detail: "Old town, 15 min walk" },
    ],
  },
];

export function loadDevices(): Device[] {
  if (typeof window === "undefined") return seedDevices;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDevices;
    const parsed = JSON.parse(raw) as Partial<Device>[];
    if (!parsed.length) return seedDevices;
    // Migrate older shapes that may not have new fields.
    return parsed.map((p) => ({
      apps: [],
      partners: [],
      notices: [],
      screensaverPhotos: [],
      screensaverDelaySec: 60,
      screensaverIntervalSec: 8,
      houseInfo: "",
      recommendations: [],
      aroundHouse: [],
      thingsToSee: [],
      ...p,
    })) as Device[];
  } catch {
    return seedDevices;
  }
}

export function saveDevices(devices: Device[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
}

export function newDevice(): Device {
  return {
    id: uid(),
    propertyName: "New property",
    guestName: "",
    language: "en",
    checkout: "11:00",
    wifiSsid: "",
    wifiPassword: "",
    supportPhone: "",
    welcomeMessage: "",
    doorCode: "",
    doorCodeValidFrom: "",
    doorCodeValidUntil: "",
    doorNote: "",
    recommendations: [],
    apps: [],
    partners: [],
    notices: [],
    screensaverPhotos: [],
    screensaverDelaySec: 60,
    screensaverIntervalSec: 8,
    houseInfo: "",
    aroundHouse: [],
    thingsToSee: [],
  };
}

export const LANGS: Record<Lang, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export const T = {
  en: {
    welcome: "Welcome",
    network: "Network",
    password: "Password",
    checkout: "Checkout",
    help: "Need help?",
    recs: "Nearby & recommended",
    enjoy: "Enjoy your stay in Béjaïa",
    wifi: "Wi-Fi",
    door: "Smart door code",
    valid: "Valid",
  },
  fr: {
    welcome: "Bienvenue",
    network: "Réseau",
    password: "Mot de passe",
    checkout: "Départ",
    help: "Besoin d'aide ?",
    recs: "À proximité",
    enjoy: "Profitez de votre séjour à Béjaïa",
    wifi: "Wi-Fi",
    door: "Code porte connectée",
    valid: "Valide",
  },
  ar: {
    welcome: "أهلاً وسهلاً",
    network: "الشبكة",
    password: "كلمة السر",
    checkout: "المغادرة",
    help: "تحتاج مساعدة؟",
    recs: "أماكن مقترحة قريبة",
    enjoy: "نتمنى لكم إقامة سعيدة في بجاية",
    wifi: "واي فاي",
    door: "رمز الباب الذكي",
    valid: "صالح",
  },
} as const;
