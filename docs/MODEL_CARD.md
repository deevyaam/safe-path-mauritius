# Model Card — Safe Path Mauritius

*Last updated: 2026-06. Version: check-in v1 (`2026-06-v1`).*

## Overview
Safe Path Mauritius surfaces **early behavioural/emotional expression signals** and routes
them to a **human reviewer**. It is a decision-**support** tool, not a decision-maker, and is
**not a diagnostic device**. It does **not** detect, infer, or confirm substance use.

The "model" is a pipeline of three transparent stages:

| Stage | What it is | Where it runs |
| --- | --- | --- |
| 1. Facial-expression sensing | MediaPipe **FaceLandmarker** (Google), outputs 52 standard facial-expression coefficients ("blendshapes") + face landmarks | **On the user's device** (browser/WebView, WASM). No image/video leaves the device. |
| 2. Indicator mapping | A small, hand-written weighted average from blendshapes → 6 review indicators | On device |
| 3. Concern scoring | A fixed weight table over the 6 indicators → 0–100 score → Low/Medium/High | On device (mirrors the backend rule; backend used only when reachable) |

## Inputs and outputs
- **Input:** a short (~3 s) live camera reading, sampled frame-by-frame and **averaged**. Optionally, indicators set manually.
- **Output:** six indicator intensities (0–100%), each with the facial cues that produced it; an overall concern score (0–100) and band (Low/Medium/High); and, in the live preview, a dominant-emotion label (Happy/Sad/Angry/Surprised/Stressed/Neutral).
- **No biometric template is created or stored.** Frames are processed and discarded; only aggregate numbers are kept for the current session.

## Indicator → blendshape mapping (glass-box)
Each indicator is the gain-scaled average of named coefficients. This is intentionally simple so a human can audit it.

| Indicator | Facial-expression coefficients used | Gain |
| --- | --- | --- |
| Stress | browDownLeft/Right, eyeSquintLeft/Right, mouthPressLeft/Right | 1.25 |
| Sadness / low mood | mouthFrownLeft/Right, browInnerUp, mouthLowerDownLeft/Right | 1.30 |
| Agitation / restlessness | jawOpen, browDownLeft/Right, mouthStretchLeft/Right, noseSneerLeft/Right | 1.20 |
| Fatigue / low energy | eyeBlinkLeft/Right, mouthShrugLower, jawOpen | 1.15 |
| Withdrawal / disengagement | eyeLookDownLeft/Right, eyeBlinkLeft/Right, mouthClose | 1.20 |
| Avoidant gaze | eyeLookOutLeft/Right, eyeLookInLeft/Right | 1.35 |

Concern score weights (Stress 20, Sadness 15, Agitation 20, Fatigue 12, Withdrawal 15, Avoidance 18); bands: ≥70 High, ≥40 Medium, else Low.

## Intended use
- Opt-in, consented wellbeing check-ins in support/educational/NGO settings, where a **trained human** follows up.
- Helping a reviewer prioritise a supportive, non-punitive conversation.

## Out-of-scope / prohibited use
See `ETHICS.md`. In short: **no** diagnosis, **no** law-enforcement, insurance, employment, or
disciplinary use, and **no** covert or non-consensual scanning.

## Performance & limitations
- These are **heuristic expression proxies**, not validated clinical measures. A single reading is noisy; it is a conversation-starter, never evidence.
- Facial-expression recognition is known to vary across **skin tone, age, gender, culture, and neurodivergence**, and with lighting, camera quality, glasses, and occlusion. The system must not be treated as objective ground truth.
- Single-frame signals (e.g. a blink) are weak proxies for states like fatigue; we average over a window to reduce noise but cannot remove this limitation.

## Mitigations
- **Human-in-the-loop is mandatory** — no automated action ever.
- **On-device processing** — no images/video are transmitted or retained.
- **Transparency** — every score shows the cues behind it; this card documents the full mapping.
- **Non-diagnostic, supportive framing** throughout the UI.
- **Audit trail** — every consent event and reviewer decision is logged and reviewable.

## Data handling
- On-device: camera frames (never uploaded, discarded after processing).
- Also stored **on the device** (localStorage, never uploaded): consent records (timestamp +
  policy version, **no personal data**), an audit log of actions, and staff accounts with
  **hashed passwords** (PBKDF2, never plain text). No faces, names, or video are stored.
- The app runs **fully offline** with no server. (An optional Python/SQLite backend remains in
  the repo for teams who want a centralised server version.)
