/* ============================================================
   On-device data layer (zero backend)
   ------------------------------------------------------------
   Everything the staff side needs — accounts, cases, audit
   trail, consent records — lives in localStorage on the device.
   No server, no network, works fully offline. Passwords are
   hashed with the Web Crypto API (PBKDF2) and never stored in
   plain text.

   (The Python/SQLite backend remains in the repo as an optional
   "real server" version, but the app no longer depends on it.)
   ============================================================ */

import { sampleCases, sampleAudit } from './data/sampleCases.js';

const USERS_KEY = 'spm_users';
const CASES_KEY = 'spm_cases';
const AUDIT_KEY = 'spm_audit';
const CONSENTS_KEY = 'spm_consents';
const CONSENT_VERSION = '2026-06-v1';

/* ---------------- storage helpers ---------------- */
function getJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function setJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/disabled */ }
}
function nowStr() {
  try { return new Date().toISOString().slice(0, 16).replace('T', ' '); } catch { return ''; }
}

/* ---------------- crypto helpers ---------------- */
function randomHex(n) {
  const a = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a);
  else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex) {
  const a = new Uint8Array(hex.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
  return a;
}
async function hashPassword(password, saltHex) {
  // PBKDF2-SHA256 via Web Crypto (available in secure contexts incl. localhost / capacitor).
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: fromHex(saltHex), iterations: 100000, hash: 'SHA-256' }, km, 256);
    return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback (very rare WebViews without subtle crypto) — functional, demo-only.
  let h = 0; const s = saltHex + password;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return 'fallback' + (h >>> 0).toString(16);
}

/* ---------------- audit trail ---------------- */
function appendAudit(entry) {
  const log = getJSON(AUDIT_KEY, null) || sampleAudit.slice();
  const id = (log[0]?.id || sampleAudit.length) + 1;
  log.unshift({ id, created_at: nowStr(), ...entry });
  setJSON(AUDIT_KEY, log.slice(0, 100));
}

export async function fetchAuditLog(limit = 50) {
  const log = getJSON(AUDIT_KEY, null) || sampleAudit;
  return log.slice(0, Math.max(1, Math.min(limit, 200)));
}

/* ---------------- accounts ---------------- */
export async function registerUser({ email, password, role }) {
  email = (email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('A valid email is required.');
  if ((password || '').length < 6) throw new Error('Password must be at least 6 characters.');
  if (!['reviewer', 'admin'].includes(role)) role = 'reviewer';

  const users = getJSON(USERS_KEY, []);
  if (users.some((u) => u.email === email)) throw new Error('An account with this email already exists.');

  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  users.push({ email, salt, hash, role, created_at: nowStr() });
  setJSON(USERS_KEY, users);
  appendAudit({ actor_role: role, action: 'user_registered', case_id: null, details: `email=${email}` });
  return { email, role, token: randomHex(24) };
}

export async function loginUser({ email, password }) {
  email = (email || '').trim().toLowerCase();
  const users = getJSON(USERS_KEY, []);
  const u = users.find((x) => x.email === email);
  if (!u) throw new Error('Invalid email or password.');
  const hash = await hashPassword(password, u.salt);
  if (hash !== u.hash) throw new Error('Invalid email or password.');
  appendAudit({ actor_role: u.role, action: 'user_login', case_id: null, details: `email=${email}` });
  return { email: u.email, role: u.role, token: randomHex(24) };
}

/* ---------------- cases ---------------- */
function loadCases() {
  const stored = getJSON(CASES_KEY, null);
  if (stored) return stored;
  setJSON(CASES_KEY, sampleCases); // seed on first run
  return sampleCases.slice();
}

export async function fetchCases() {
  return loadCases();
}

export async function createCase(payload) {
  const cases = loadCases().slice();
  const id = `C-${String(cases.length + 1).padStart(3, '0')}`;
  // Anonymous reference so reviewers can tell check-ins apart without any
  // personal data (the check-in collects no name).
  const ref = randomHex(2).toUpperCase();
  const record = {
    id,
    name: payload.name || `Check-in #${ref}`,
    concern_level: payload.concern_level || 'Low',
    status: 'Pending',
    summary: payload.summary || '',
    indicators: payload.indicators || '',
    reviewer_notes: '',
    referral: ''
  };
  cases.unshift(record); // newest first
  setJSON(CASES_KEY, cases);
  appendAudit({ actor_role: 'subject', action: 'case_created', case_id: id, details: `score=${payload.score}; level=${payload.concern_level}` });
  return { id, concern_level: record.concern_level, status: record.status };
}

export async function reviewCase(caseId, payload) {
  const cases = loadCases().slice();
  const c = cases.find((x) => x.id === caseId);
  if (c) {
    if (payload.status) c.status = payload.status;
    if (payload.reviewer_notes !== undefined) c.reviewer_notes = payload.reviewer_notes;
    if (payload.referral !== undefined) c.referral = payload.referral;
    setJSON(CASES_KEY, cases);
    const details = `status=${payload.status}` + (payload.referral ? `; referral=${payload.referral}` : '');
    appendAudit({ actor_role: payload.actor_role || 'reviewer', action: 'review_action', case_id: caseId, details });
  }
  return { status: 'updated', case_id: caseId };
}

/* ---------------- consent ---------------- */
export async function recordConsent(payload) {
  const records = getJSON(CONSENTS_KEY, []);
  const record = {
    id: records.length + 1,
    created_at: nowStr(),
    consent_version: CONSENT_VERSION,
    scope: payload.scope || 'on-device facial-expression check-in + human review',
    granted: payload.granted ? 1 : 0
  };
  records.unshift(record);
  setJSON(CONSENTS_KEY, records);
  appendAudit({ actor_role: 'subject', action: 'consent_granted', case_id: null, details: `scope=${record.scope}` });
  return record;
}

export async function fetchConsents() {
  return { version: CONSENT_VERSION, records: getJSON(CONSENTS_KEY, []) };
}

/* ---------------- analysis scoring (on-device) ---------------- */
const RISK_WEIGHT = { stress: 20, sadness: 15, agitation: 20, fatigue: 12, withdrawal: 15, avoidance: 18 };

export async function analyzeIndicators(indicators) {
  let score = 0;
  const reasons = [];
  for (const [label, active] of Object.entries(indicators || {})) {
    if (!active) continue;
    const weight = RISK_WEIGHT[label] ?? 10;
    score += weight;
    reasons.push(`${label.charAt(0).toUpperCase()}${label.slice(1)} indicator observed adds ${weight} points`);
  }
  score = Math.min(score, 100);
  const concern_level = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  return {
    score,
    concern_level,
    reasons,
    explanation: 'Scored on this device. This is an early risk indicator score — human review is required before any referral or action.'
  };
}
