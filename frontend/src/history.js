/* On-device check-in history (localStorage). Supports "early indicators
   over time": we keep a short, private history of check-in scores and
   per-signal intensities so the app can show drift across check-ins.
   Nothing is uploaded — this lives only on the user's device. */

const KEY = 'spm_checkin_history';
const MAX = 20;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function appendCheckin(entry) {
  const history = loadHistory();
  history.push({ ts: Date.now(), ...entry });
  const trimmed = history.slice(-MAX);
  try { localStorage.setItem(KEY, JSON.stringify(trimmed)); } catch { /* storage full / disabled */ }
  return trimmed;
}

export function clearHistory() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/* Compute a simple, honest trend across recent check-ins. */
export function computeTrend(history) {
  if (!history || history.length < 2) return null;

  const recent = history.slice(-6);
  const scores = recent.map((h) => (typeof h.score === 'number' ? h.score : 0));
  const latest = scores[scores.length - 1];
  const prior = scores.slice(0, -1);
  const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
  const delta = Math.round(latest - priorAvg);

  let direction = 'steady';
  if (delta >= 6) direction = 'rising';
  else if (delta <= -6) direction = 'easing';

  const message = {
    rising: 'Your concern signals have risen compared with your recent check-ins. This can be a good moment to reach out for support.',
    easing: 'Your concern signals have eased compared with your recent check-ins.',
    steady: 'Your concern signals are broadly steady compared with your recent check-ins.'
  }[direction];

  // per-signal drift (only across entries that recorded intensities)
  const withSignals = recent.filter((h) => h.signals && typeof h.signals === 'object');
  let perSignal = [];
  if (withSignals.length >= 2) {
    const last = withSignals[withSignals.length - 1].signals;
    const before = withSignals.slice(0, -1);
    perSignal = Object.keys(last).map((key) => {
      const avgBefore = before.reduce((a, h) => a + (h.signals[key] || 0), 0) / before.length;
      const d = (last[key] || 0) - avgBefore;
      const dir = d >= 0.08 ? 'up' : d <= -0.08 ? 'down' : 'flat';
      return { key, latest: last[key] || 0, delta: d, dir };
    });
  }

  return { scores, latest, delta, direction, message, perSignal, count: history.length };
}
