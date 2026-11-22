# Ethics Statement — Safe Path Mauritius

Safe Path Mauritius is built for one purpose: to help communities offer **earlier, kinder
support**. Everything below is a commitment we hold the design to. See `MODEL_CARD.md` for the
technical detail.

## 1. Purpose & framing
- The tool surfaces **emotional/behavioural expression signals** and routes them to a trained
  human. It is **decision support, never a decision-maker**.
- It is **not a diagnosis** and **does not detect or confirm substance use**. No score means a
  person "is" anything. A high signal means "a human should check in kindly."

## 2. Consent
- Use is **opt-in and explicit**. Nothing is analysed before consent is given.
- Consent is **recorded** (timestamp + policy version only) and is **revocable** at any time.
- We never analyse anyone **covertly** or without their knowledge.

## 3. Privacy & data minimization
- Facial analysis runs **entirely on the user's device**. **No image or video is ever uploaded
  or stored.** Only derived, aggregate signals exist, and only for the session.
- We create **no biometric template** and perform **no identity recognition**.
- The app runs **fully on the device** with no server. The only things kept (on the device, never
  uploaded) are **consent records**, an **audit log**, and **staff accounts with hashed passwords** —
  no names, faces, or video.

## 4. Human oversight & accountability
- **No automated action is ever taken.** Every result is reviewed by a trained person who
  decides whether and how to offer support.
- Every consent event and every reviewer decision is written to an **audit trail** that admins
  can inspect — making oversight visible and accountable.
- Outreach is **supportive and non-punitive** by design.

## 5. Fairness & bias
- Facial-expression recognition can systematically **misread people** by skin tone, age,
  gender, culture, and neurodivergence, and is sensitive to lighting and camera quality.
- We mitigate by: keeping outputs **non-diagnostic**, requiring **human review**, showing the
  **cues behind every signal**, and documenting limitations openly. The human reviewer is
  expected to treat signals as fallible prompts, not facts.

## 6. Out-of-scope & prohibited uses
This system must **not** be used for:
- Medical or psychiatric **diagnosis**.
- **Law enforcement**, surveillance, or any punitive/disciplinary action.
- **Insurance, employment, or eligibility** decisions.
- **Covert, mandatory, or non-consensual** scanning of any person.
- Any decision that materially affects a person **without a human in the loop**.

## 7. Failure modes we acknowledge
- A single reading is **noisy** and easily skewed by mood, lighting, or performance for the camera.
- Expression ≠ internal state; people mask feelings, and norms differ across cultures.
- The concern score is a **transparent heuristic**, not a validated instrument.

## 8. Safeguarding
- Resources and referral pathways are surfaced supportively. The product is an early-support
  aid, not a crisis service; acute risk should always be escalated to appropriate human help.

*This is a hackathon proof-of-concept. A production deployment would add formal review,
independent bias auditing, secure authentication, encryption at rest, and data-retention limits.*
