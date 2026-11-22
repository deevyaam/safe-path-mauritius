/* ============================================================
   On-device facial-expression analysis (glass-box)
   ------------------------------------------------------------
   Uses MediaPipe FaceLandmarker, which runs ENTIRELY in the
   browser / WebView. No image or video frame ever leaves the
   device — only derived, aggregate expression signals are used.

   This does NOT detect substance use. It estimates *emotional /
   behavioural expression signals* from the face (a recognised
   computer-vision task) and maps them, transparently, to the
   same indicators the human reviewer already works with.
   ============================================================ */

import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

/* Transparent mapping: each review indicator = an average of named
   facial-expression coefficients (ARKit-style blendshapes).
   Documented in docs/MODEL_CARD.md. Intentionally simple so a human can audit it. */
const INDICATOR_MAP = {
  stress: {
    label: 'Stress signals',
    shapes: ['browDownLeft', 'browDownRight', 'eyeSquintLeft', 'eyeSquintRight', 'mouthPressLeft', 'mouthPressRight'],
    gain: 1.25
  },
  sadness: {
    label: 'Sadness or low mood',
    shapes: ['mouthFrownLeft', 'mouthFrownRight', 'browInnerUp', 'mouthLowerDownLeft', 'mouthLowerDownRight'],
    gain: 1.3
  },
  agitation: {
    label: 'Agitation or restlessness',
    shapes: ['jawOpen', 'browDownLeft', 'browDownRight', 'mouthStretchLeft', 'mouthStretchRight', 'noseSneerLeft', 'noseSneerRight'],
    gain: 1.2
  },
  fatigue: {
    label: 'Fatigue or low energy',
    shapes: ['eyeBlinkLeft', 'eyeBlinkRight', 'mouthShrugLower', 'jawOpen'],
    gain: 1.15
  },
  withdrawal: {
    label: 'Withdrawal or disengagement',
    shapes: ['eyeLookDownLeft', 'eyeLookDownRight', 'eyeBlinkLeft', 'eyeBlinkRight', 'mouthClose'],
    gain: 1.2
  },
  avoidance: {
    label: 'Avoidant gaze',
    shapes: ['eyeLookOutLeft', 'eyeLookOutRight', 'eyeLookInLeft', 'eyeLookInRight'],
    gain: 1.35
  }
};

const PRETTY = {
  browDownLeft: 'brow lowering', browDownRight: 'brow lowering',
  browInnerUp: 'inner-brow raise', eyeSquintLeft: 'eye tension', eyeSquintRight: 'eye tension',
  mouthPressLeft: 'lip pressing', mouthPressRight: 'lip pressing',
  mouthFrownLeft: 'mouth frown', mouthFrownRight: 'mouth frown',
  mouthLowerDownLeft: 'lower-lip pull', mouthLowerDownRight: 'lower-lip pull',
  jawOpen: 'jaw opening', mouthStretchLeft: 'mouth stretch', mouthStretchRight: 'mouth stretch',
  noseSneerLeft: 'nose tension', noseSneerRight: 'nose tension',
  eyeBlinkLeft: 'eye closing', eyeBlinkRight: 'eye closing', mouthShrugLower: 'chin tension',
  eyeLookDownLeft: 'downward gaze', eyeLookDownRight: 'downward gaze', mouthClose: 'closed mouth',
  eyeLookOutLeft: 'gaze aversion', eyeLookOutRight: 'gaze aversion',
  eyeLookInLeft: 'gaze aversion', eyeLookInRight: 'gaze aversion'
};

/* Dominant-emotion model for the live overlay label. */
const EMOTIONS = {
  Happy: (s) => avg(s.mouthSmileLeft, s.mouthSmileRight),
  Sad: (s) => avg(s.mouthFrownLeft, s.mouthFrownRight) * 0.75 + (s.browInnerUp || 0) * 0.5,
  Angry: (s) => avg(s.browDownLeft, s.browDownRight) * 0.7 + avg(s.noseSneerLeft, s.noseSneerRight) * 0.4,
  Surprised: (s) => avg(s.browOuterUpLeft, s.browOuterUpRight) * 0.5 + (s.jawOpen || 0) * 0.5 + avg(s.eyeWideLeft, s.eyeWideRight) * 0.3,
  Stressed: (s) => avg(s.eyeSquintLeft, s.eyeSquintRight) * 0.5 + avg(s.mouthPressLeft, s.mouthPressRight) * 0.5 + avg(s.browDownLeft, s.browDownRight) * 0.3
};

const clamp01 = (n) => Math.max(0, Math.min(1, n));
function avg(...xs) { const v = xs.filter((n) => typeof n === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; }

let landmarkerPromise = null;

/** Load the model once. Tries bundled (offline) assets first, then a CDN; GPU then CPU. */
export async function ensureFaceModel() {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const sources = [
      { wasm: '/mediapipe/wasm', model: '/mediapipe/face_landmarker.task' },
      {
        wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        model: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
      }
    ];
    let lastErr;
    for (const src of sources) {
      let fileset;
      try {
        fileset = await FilesetResolver.forVisionTasks(src.wasm);
      } catch (err) { lastErr = err; continue; }
      // CPU first: on many Android WebViews the GPU delegate returns face
      // landmarks but EMPTY blendshapes — exactly the expression data this app
      // needs. CPU is slightly slower but produces blendshapes reliably.
      for (const delegate of ['CPU', 'GPU']) {
        try {
          return await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: src.model, delegate },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true
          });
        } catch (err) { lastErr = err; }
      }
    }
    landmarkerPromise = null;
    throw lastErr || new Error('Could not load the on-device model.');
  })();
  return landmarkerPromise;
}

function blendshapesToMap(categories) {
  const m = {};
  if (categories) for (const c of categories) m[c.categoryName] = c.score;
  return m;
}

function dominantEmotion(shapes) {
  let best = { label: 'Neutral', score: 0 };
  for (const [label, fn] of Object.entries(EMOTIONS)) {
    const score = clamp01(fn(shapes));
    if (score > best.score) best = { label, score };
  }
  if (best.score < 0.12) return { label: 'Neutral', score: best.score };
  return best;
}

/**
 * Detect a single video frame. Must be called with strictly increasing tsMs.
 * @returns {{face:boolean, box?:{minX,minY,maxX,maxY}, emotion?:{label,score}, shapes?:Object}}
 */
export function detectFaceFrame(landmarker, video, tsMs) {
  if (!landmarker || !video || video.readyState < 2) return { face: false };
  let result;
  try {
    result = landmarker.detectForVideo(video, tsMs);
  } catch {
    return { face: false };
  }
  const lm = result?.faceLandmarks?.[0];
  if (!lm || !lm.length) return { face: false };

  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const p of lm) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const shapes = blendshapesToMap(result?.faceBlendshapes?.[0]?.categories);
  return { face: true, box: { minX, minY, maxX, maxY }, emotion: dominantEmotion(shapes), shapes };
}

/** Map averaged blendshapes → review indicators (0..1) with glass-box evidence. */
export function mapShapesToIndicators(avgShapes) {
  const indicators = {};
  const evidence = {};
  const flags = [];
  for (const [key, def] of Object.entries(INDICATOR_MAP)) {
    const present = def.shapes.filter((s) => avgShapes[s] != null);
    const mean = present.length ? present.reduce((a, s) => a + avgShapes[s], 0) / present.length : 0;
    const intensity = clamp01(mean * def.gain);
    indicators[key] = intensity;
    const top = [...present].sort((a, b) => avgShapes[b] - avgShapes[a]).slice(0, 2).map((s) => PRETTY[s] || s);
    evidence[key] = [...new Set(top)].join(', ');
    if (intensity >= 0.15) flags.push(`${def.label}: ${Math.round(intensity * 100)}% — from ${evidence[key]}`);
  }
  return { indicators, evidence, flags };
}

/** Threshold intensities into the boolean indicator map the backend expects. */
export function intensitiesToIndicators(indicators, threshold = 0.15) {
  const out = {};
  for (const [k, v] of Object.entries(indicators)) out[k] = v >= threshold;
  return out;
}

export const INDICATOR_LABELS = Object.fromEntries(
  Object.entries(INDICATOR_MAP).map(([k, v]) => [k, v.label])
);
