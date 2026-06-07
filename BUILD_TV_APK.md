# Build the Bayti TV APK (Thomson Android TV — Android 11)

You can't build an Android APK inside Lovable (Lovable's build is web only).
The repo is already set up so a free GitHub Actions build will produce the APK
for you. Two options.

---

## Option A — GitHub Actions (recommended, free, no PC setup)

1. **Publish your Lovable app** (top-right "Publish" button) so the TV has a
   stable URL like `https://your-name.lovable.app`.
2. Open **`capacitor.config.ts`** and replace the `server.url` value with
   **`https://YOUR-PUBLISHED-URL/tv`** (keep the `/tv` at the end — that's
   the TV launcher route).
3. Push this whole project to a GitHub repo (any free GitHub account works).
4. In the repo: **Actions tab → enable workflows → run "Build Android TV APK"**.
5. When it finishes (~5 min): open the run → **Artifacts** → download
   **`bayti-tv-apk.zip`** → unzip → you get **`app-debug.apk`**.
6. Sideload on the Thomson TV:
   - copy `app-debug.apk` to a USB stick → plug into TV → open with a file
     manager (e.g. "X-plore", "File Commander") → install, OR
   - on a PC with adb: `adb connect <tv-ip>` then `adb install app-debug.apk`.
7. First time you press the TV's **Home** button, Android asks which launcher
   to use — pick **Bayti TV** and "Always". Done.

---

## Option B — Online APK build services

If you don't want GitHub, you can zip the project and upload to a hosted
Capacitor build service such as **Ionic Appflow**, **Codemagic**, or
**Bitrise**. They all accept the same Capacitor config. Use the same two
prep steps:

1. Publish in Lovable, update `capacitor.config.ts` → `server.url`.
2. Tell the service: framework = **Capacitor**, platform = **Android**,
   build command = `bun install && bun run build && npx cap add android &&
   npx cap sync android && cd android && ./gradlew assembleDebug`.
3. Replace `android/app/src/main/AndroidManifest.xml` with
   `android-overrides/app/src/main/AndroidManifest.xml` from this repo
   (that's what adds the TV launcher + default-home intents).

---

## What's in the APK

- A full-screen WebView pinned to `/tv` (the launcher screen).
- TV manifest with `LEANBACK_LAUNCHER` + `HOME` intents → installable as the
  **default launcher** on the Thomson TV.
- `@capacitor/app-launcher` plugin → the "Apps" row on `/tv` can open the
  real Android apps you whitelisted in Admin (Netflix, YouTube, etc.).

## Updating content

You **do not need to rebuild the APK** to change welcome message, apps list,
partners, notifications, screensaver photos, or house info. Edit them in
**Admin** in Lovable → click Publish → the TV picks them up on next reload.

You **do** need to rebuild the APK if you change `capacitor.config.ts`, the
manifest, or the Capacitor plugins.

## Signed release APK

`app-debug.apk` is fine for sideloading on your own TVs. If you ever want a
signed `app-release.apk` (e.g. for Play Store / MDM), generate a keystore
and add the signing config to `android/app/build.gradle` — open an issue and
we'll wire it into the GitHub Actions workflow.
