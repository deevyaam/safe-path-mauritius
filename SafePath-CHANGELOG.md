# Safe Path Mauritius — Changelog

## Update 5.4 — Comprehensive, text-only README (latest)

- **Rewrote the README** into a detailed, judge-facing document: problem framing, the originality
  angle, the user journey, a feature tour, **architecture + AI-pipeline diagrams** (text-based
  Mermaid), a full privacy/ethics section, engineering highlights, an on-device data model, tech
  stack, getting-started, project structure, an explicit **judging-criteria map**, honest
  limitations, and a roadmap.
- **Text-only** — no embedded images or badges (the team will add screenshots), with invisible
  placeholder markers showing where screenshots fit. No machine-specific paths.
- (Docs only — no app/APK change.)

---

## Update 5.2 — UI polish pass

Small refinements from a design-quality review (`make-interfaces-feel-better`):

- **Concentric corners** — cards nested inside cards now step down their corner radius (with a
  subtle inset edge) so nested surfaces read correctly instead of doubling up the same radius.
- **Tactile press** — fixed press animations that shrank too far (the bottom-tab icons and the
  account button) to the standard subtle `0.96`.
- **Bigger tap targets** — the top-bar role chip and sign-out button are now a full 40×40 px.

> Reinstall `SafePathMauritius-debug.apk`.

---

## Update 5.1 — Mobile fixes: audit layout + anonymous case names

- **Fixed the Admin audit-trail overflow on mobile.** The table was wider than the screen and
  spilled outside its card. It's now a clean **stacked list** that fits any width, with long
  details (emails, referral notes) wrapping neatly. Reviewer table also made scroll-safe.
- **Check-in cases now get a unique anonymous reference** (e.g. `Check-in #6110`) instead of all
  showing "Self check-in", so reviewers can tell them apart — still with **no personal data**.
- Removed the misleading "UTC" label on timestamps (data is on-device local time now).

> Reinstall `SafePathMauritius-debug.apk`.

---

## Update 5 — Fully on-device, no backend needed

The app now runs **completely on the device** — no server to deploy or run.

- **Accounts (login/registration)** are stored on the device, with passwords **hashed via the
  browser’s Web Crypto (PBKDF2)** — never in plain text.
- **Cases, the audit trail, and consent records** are stored on the device too. The reviewer /
  referral / admin screens start from realistic sample cases and grow as you create cases from
  check-ins and take review actions — all without a backend.
- This means the **whole app works offline on the phone** — nothing to host, no cold starts, no
  network needed.

The Python/SQLite backend stays in the repo as an optional "central server" version, but the
app no longer depends on it. (The earlier "start the backend" notes no longer apply.)

> Reinstall `SafePathMauritius-debug.apk`. Tip: register a **reviewer** and an **admin** account
> to demo both staff views. Data persists on the device between launches.

---

## Update 4 — Staff login + reliable demo data

### 🔐 Login & registration (real accounts)
- Added a **staff sign-in / registration** page. Accounts are stored in the existing **SQLite**
  database with **hashed passwords** (no plain text, no new dependencies).
- The public check-in stays **account-free**; reviewer / referral / admin tools now require
  signing in. Your role (reviewer or admin) comes from your account, shown in the top bar with
  a sign-out button.

### 🗂️ Reviewer / referral / admin now always show data
- These screens were blank because they need the backend. They now **fall back to built-in
  sample cases** (6 realistic records + a sample audit trail) when the backend isn't connected,
  so the **demo always works** — including on the phone. A small banner notes when it's sample
  vs. live data.
- When the backend *is* running, real records (including cases created from check-ins) show
  instead, and reviewer actions save to it.

> Note: these are the same updates on the **web app and the Android app** — one shared codebase.
> Reinstall `SafePathMauritius-debug.apk`. Login & live records need the backend running;
> the sample data and the whole citizen check-in work offline.

---

## Update 3.3 — Android camera reliability

Three Android-specific issues fixed:

- **Analysis came back all 0%** — on many Android phones the GPU path returns face position
  but *no expression data*. The app now uses the CPU path, which returns the expression
  signals reliably, so the readings are real.
- **Detection stopped after a few seconds** (until reopening the app) — fixed how the camera
  is sampled so detection keeps running for the whole session.
- **No green box around the face** — Android draws the camera on a special layer that hid the
  box. The app now draws the camera picture *and* the box together, so the green box and the
  live emotion % show up properly.

> Reinstall `SafePathMauritius-debug.apk`. The on-screen preview is now drawn by the app, so
> the box tracks your face and updates the emotion label live.

---

## Update 3.2 — Face detection, overlay & analysis fixes

### 🐛 Face detected only on the first scan, then never again
- The detection loop could stop permanently if any single frame hit an error (e.g. right
  after a scan finished). The loop is now crash-proof and keeps running for the whole session.
- Detection now runs only when the camera frame actually advances (the recommended pattern),
  which makes it far more reliable on phones.

### 🟩 Green face box not appearing
- The box now redraws on every animation frame using the latest detection, so it stays on your
  face smoothly instead of flickering away. Made it thicker and brighter, too.

### ▶️ "Run analysis" did nothing
- If you reached Check-in without giving consent, the button bailed out silently. It now sends
  you to the consent step so the flow always continues.

> Reinstall `SafePathMauritius-debug.apk`. Tip: visit **Consent** once before analysing.

---

## Update 3.1 — Camera preview fix

### 🐛 Fixed: camera preview showing a play button instead of live video
- On Android the camera preview could show a paused play-button placeholder (and the scan
  reported "No face detected") even though permission was granted. The live video stream was
  being attached before the preview element had loaded. It now attaches and starts playback
  once the preview is ready, so you see live video, the green face box tracks, and the scan
  gets frames. Reinstall the new `SafePathMauritius-debug.apk`.

---

## Update 3 — Closing the loop, safety & trends

### 🔗 The check-in now becomes a real case
- Finishing a check-in and tapping **"Send to reviewer dashboard"** now **creates a real case**
  in the reviewer queue (with the score, indicators, and a trend note), and logs it to the
  audit trail. The citizen check-in and the staff review side are now one connected flow.

### 🆘 Crisis & support pathways
- A **High-concern result** now surfaces a prominent, supportive **crisis card** with verified
  Mauritius helplines you can tap to call: **Befrienders Mauritius 800 9393**, **Police 999**,
  **Ambulance/SAMU 114**.
- Every result shows a **Support resources** section (free, confidential help), including
  treatment pathways (NATReSA, Idrice Goomany Centre, your GP). Resources live in one editable
  file (`src/data/resources.js`) — *confirm the specialist numbers before any real deployment.*

### 📈 Trends over time ("early indicators")
- The app now keeps a **private, on-device history** of your check-ins (localStorage — nothing
  uploaded) and shows a **trend sparkline** plus a plain-language read of whether your signals
  are **rising / easing / steady**, and which specific signals are drifting up or down.
  This is what makes it about *early* support, not a one-off snapshot.

> APK: still ~14 MB. Reinstall `SafePathMauritius-debug.apk`. The crisis card and trends work
> fully offline on the phone; creating a reviewer case needs the backend running on a reachable
> machine (fine for a laptop demo).

---

## Update 2 — Real AI, privacy & ethics

### 🧠 The camera now does real, on-device analysis
- The webcam check-in is no longer a placeholder. It runs a **real facial-expression model
  (Google MediaPipe FaceLandmarker)** that reads 52 facial-expression signals and maps them —
  transparently — to the app's six indicators (stress, sadness, agitation, fatigue,
  withdrawal, avoidant gaze). Each result shows **which facial cues produced it** (glass-box).
- **Runs 100% on the device.** No image or video is ever uploaded or stored — which makes the
  "privacy at the centre" promise real, not just words. The model is **bundled in the app**, so
  it works fully **offline**.
- It estimates **emotional/behavioural expression** only — never a substance-use verdict — and
  every result is routed to a **human reviewer**. Still not a diagnosis.

### 🟩 Live face box + emotion readout
- While the camera is on, a **green box tracks your face in real time**, with the **dominant
  emotion and a percentage** (Happy / Sad / Angry / Surprised / Stressed / Neutral) shown above it.

### 📴 Works without a backend (fixes the "ensure the backend is running" error)
- The personal check-in now **scores on-device** if the server isn't reachable, so the phone
  app works standalone. (The backend is still used when available, for case records.)

### 🔐 Consent & audit are now real, not just copy
- Giving consent now **records a timestamped, revocable consent entry** (no personal data —
  only a timestamp + policy version).
- Every reviewer decision and consent event is written to an **audit trail**, visible in the
  **Admin → Oversight** screen. Proof that nothing is automated or hidden.

### 📜 Ethics documentation
- Added a **Model Card** (`docs/MODEL_CARD.md`) and **Ethics Statement** (`docs/ETHICS.md`):
  intended use, prohibited uses, the full signal mapping, bias/fairness, and failure modes.
- Added an in-app **Ethics & privacy** page (linked from the home screen).

> APK note: the app is now ~14 MB (it bundles the offline AI model). Reinstall the new
> `SafePathMauritius-debug.apk` over the old one. Tap **Start camera** → allow the permission →
> **Analyze expression**.

---

## Update 1 — Android app + UI revamp

### 🚀 It's now a real Android app
- Wrapped the existing React web app into a native **Android app** using **Capacitor**.
- **No app logic was changed** — the consent flow, analysis, scoring, reviewer dashboard,
  referral and admin all work exactly as before. They now also run as a phone app.
- A ready-to-install **`SafePathMauritius-debug.apk`** is included in the project folder.
- Added a new `android/` project folder (the native Android wrapper) and
  `frontend/capacitor.config.json`.

### 🎨 Full UI revamp (mobile-first, calmer, more professional)
- New **calm, muted colour palette** suited to the topic (deep teal, soft sage-grey
  background; gentle sage / ochre / terracotta for Low / Medium / High concern — nothing
  bright or alarming).
- New **top app bar** with a shield logo and a role switcher "chip".
- New **bottom tab bar** (like a real phone app) that **changes based on role** — visitors
  see the citizen journey; reviewers/admins see the staff tools.
- Polished details throughout: rounded "concentric" cards, soft layered shadows instead of
  hard lines, buttons that gently press in when tapped, smooth staggered fade-in animations,
  an animated **score meter** on the Results page, larger tap targets, and safe spacing
  around phone notches.
- Respects "reduce motion" accessibility settings.

### 🛠️ Housekeeping / fixes
- Added the missing **`frontend/package.json`** (the project wouldn't `npm install` without
  it before).
- Added handy scripts: `npm run cap:sync` (build + push to Android) and `npm run cap:open`.
- Updated `index.html` for mobile (notch-safe sizing, theme colour).

### Files touched (for reference)
- `frontend/src/styles.css` — rewritten as a full design system
- `frontend/src/components/NavBar.jsx` — new app bar + bottom tab bar
- `frontend/src/components/ResultsPage.jsx` — animated score meter
- `frontend/src/components/LandingPage.jsx` — small hero label
- `frontend/index.html`, `frontend/package.json` — mobile + scripts
- `frontend/capacitor.config.json`, `frontend/android/` — new Android project

### What did NOT change
- The risk-scoring logic, the backend API, the database, and all the screen contents/flow
  are unchanged. This update is about **packaging (Android)** and **look-and-feel**.

---

**How to rebuild after making changes:** see `BUILD_GUIDE.md` inside the project folder.
Short version: install **Node.js** + **Android Studio**, then in `frontend/` run
`npm install` once, and after edits run `npm run cap:sync` and build from Android Studio.
