# Safe Path Mauritius — How to Edit & Rebuild the Android App

A beginner-friendly guide. No prior Android experience needed.
The app is a normal **React website** wrapped into an **Android app** using a tool
called **Capacitor**. You edit the website code, then "sync + build" to get a new APK.

> The app includes a real **on-device AI model** (MediaPipe) for the facial-expression
> check-in. It is bundled inside the app, so the camera analysis, crisis card, and trends
> all work **fully offline** on the phone. This makes the installed app ~14 MB — that's normal.

---

## 1. What to install (one time)

You need exactly **two** things. Install them in this order:

### A. Node.js (runs the website part)
- Download the **LTS** version: https://nodejs.org
- Install with all default options.
- To check it worked, open a terminal (Command Prompt / PowerShell on Windows) and run:
  ```
  node -v
  ```
  You should see a version like `v20.x`.

### B. Android Studio (builds the Android app — includes Java + the Android SDK)
- Download: https://developer.android.com/studio
- Install with default options. On first launch it runs a **Setup Wizard** — click
  through it and let it download the "Android SDK" (this is automatic; just accept).
- That's it. Android Studio bundles **Java (JDK)** and the **Android SDK** for you, so
  you do NOT need to install those separately.

> 💡 You do not need to be online to *run* the app, but you DO need internet the first
> time you build (it downloads build tools).

---

## 2. One-time project setup

1. Unzip the project somewhere simple, e.g. `Documents\SafePath`.
2. Open a terminal **inside the `frontend` folder**. (Tip on Windows: open the `frontend`
   folder in File Explorer, type `cmd` in the address bar, press Enter.)
3. Install the website dependencies (one time, takes a minute):
   ```
   npm install
   ```

---

## 3. The edit → rebuild loop (do this every time you change something)

### Step 1 — Make your changes
All the screens live in **`frontend/src/components/`** (e.g. `LandingPage.jsx`,
`AnalysisPage.jsx`). Colors and styling live in **`frontend/src/styles.css`**.

**Where the important pieces live:**

| You want to change… | Edit this file |
| --- | --- |
| Any screen's layout/text | `frontend/src/components/*.jsx` |
| Colours, fonts, spacing | `frontend/src/styles.css` |
| **Helpline / support phone numbers** | `frontend/src/data/resources.js` |
| How face signals map to indicators | `frontend/src/faceAnalysis.js` (documented in `docs/MODEL_CARD.md`) |
| The on-device check-in history/trend | `frontend/src/history.js` |
| Ethics text shown in-app | `frontend/src/components/EthicsPage.jsx` |
| The server-side endpoints | `backend/routers/*.py` |

> ⚠️ **Do not delete `frontend/public/mediapipe/`** — that folder holds the bundled AI model
> and WASM files that make the camera analysis work offline. If it's missing, the camera
> "Analyze expression" step won't run.

To preview changes quickly in a normal web browser (fastest way to work):
```
npm run dev
```
Then open the link it prints (usually http://localhost:5173). Edit, save, see it update
live. Press `Ctrl+C` in the terminal to stop.

### Step 2 — Push your changes into the Android app
From the `frontend` folder, run:
```
npm run cap:sync
```
This builds the website and copies it into the Android project. **Run this after every
change**, before building the APK.

### Step 3 — Build the APK
Open Android Studio → **Open** → select the **`frontend/android`** folder.
Wait for it to finish loading (bottom status bar stops moving — first time is slow).

Then either:
- **Easiest:** Plug in an Android phone (with USB debugging on) or start an emulator, and
  press the green **▶ Run** button. The app installs and opens automatically.
- **To get a shareable .apk file:** menu **Build → Build App Bundle(s) / APK(s) →
  Build APK(s)**. When done, click the **"locate"** link in the popup. The file is:
  ```
  frontend/android/app/build/outputs/apk/debug/app-debug.apk
  ```

---

## 4. Installing the APK on a phone (to share with others)

1. Send the `app-debug.apk` file to the phone (email, USB, cloud drive).
2. Tap it. Android will ask to allow "install from unknown sources" — allow it.
3. The app installs like any other app.

A ready-made APK is already included in this project as **`SafePathMauritius-debug.apk`**
if you just want to try it before changing anything.

---

## 5. What works offline vs. what needs the backend

The app is split so the **personal check-in works fully on the phone, offline**:

| Works **offline** on the phone (no server) | Needs the **backend** running on a reachable computer |
| --- | --- |
| Camera + facial-expression analysis (on-device) | Reviewer dashboard (list of cases) |
| Live face box + emotion overlay | Creating a case from a check-in ("Send to reviewer") |
| Concern score & results (scored on-device) | Referral workflow |
| Crisis card + support resources | Admin oversight / audit trail |
| Check-in trends over time (stored on the device) | Consent records saved server-side |

So for a **phone demo**, the whole citizen journey (consent → camera → results → crisis →
trends) works with no server at all. The **staff side** (reviewer / referral / admin) needs
the Python backend.

The backend (in `backend/`) talks on `http://localhost:8000`. To run it on a computer:
```
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
cd ..
uvicorn backend.app:app --reload --port 8000
```
It exposes: `/analysis`, `/cases` (list + create), `/consent`, `/audit`, `/admin`, `/auth`.
The database is a single file at `backend/data/safe_path.db` (auto-created and seeded).

> To point a **real phone** at a backend, change `http://localhost:8000` in
> `frontend/src/api.js` to the computer's IP (same Wi-Fi), then `npm run cap:sync` and rebuild.

---

## 6. If something goes wrong

| Problem | Fix |
| --- | --- |
| `npm` not recognized | Node.js isn't installed or terminal needs restarting. Reinstall Node, reopen terminal. |
| Android Studio "SDK not found" | Let the Setup Wizard finish; it downloads the SDK automatically. |
| Build fails first time | Make sure you're online — the first build downloads tools. Try **File → Sync Project with Gradle Files**. |
| Changes don't show in the app | You forgot `npm run cap:sync` before building. |
| White screen in the app | Run `npm run cap:sync` again, then rebuild. |
| Camera shows no permission prompt | The new build already declares the camera permission. If you denied it once, re-enable via Settings → Apps → Safe Path Mauritius → Permissions → Camera. |
| "Analyze expression" does nothing / errors | Make sure `frontend/public/mediapipe/` exists (the bundled model). Re-run `npm install` then `npm run cap:sync`. |
| Reviewer/Admin screens are empty | That's expected without the backend running — see Section 5. |
