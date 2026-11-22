import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeIndicators } from '../api';
import { appendCheckin } from '../history';
import {
  ensureFaceModel,
  detectFaceFrame,
  mapShapesToIndicators,
  intensitiesToIndicators,
  INDICATOR_LABELS
} from '../faceAnalysis';

const indicatorOptions = [
  { key: 'stress', label: 'Stress signals' },
  { key: 'sadness', label: 'Sadness or low mood' },
  { key: 'agitation', label: 'Agitation or restlessness' },
  { key: 'fatigue', label: 'Fatigue or low energy' },
  { key: 'withdrawal', label: 'Withdrawal or disengagement' },
  { key: 'avoidance', label: 'Avoidant gaze' }
];

const offlineDemoTemplate = {
  concernLevel: 'Medium',
  score: 58,
  flags: ['Simulated stress dips observed', 'Mild fatigue pattern indicated', 'Possible avoidant gaze signs'],
  explanation: 'This offline demo shows a stable support workflow without requiring a backend or live camera input.'
};

const SCAN_MS = 3200;
const DETECT_INTERVAL = 70; // ms between detections (~14fps) — smooth without overloading the CPU delegate

export default function AnalysisPage({ consentGiven, onResult }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const scanRef = useRef({ active: false, start: 0, totals: {}, frames: 0 });
  const faceVisibleRef = useRef(false);
  const progressRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastDetectRef = useRef(0);
  const lastFrameRef = useRef({ face: false });

  const [indicators, setIndicators] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [webcamError, setWebcamError] = useState('');

  const [modelStatus, setModelStatus] = useState('idle'); // idle | loading | ready | error
  const [faceVisible, setFaceVisible] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceProgress, setFaceProgress] = useState(0);
  const [faceResult, setFaceResult] = useState(null);
  const [faceError, setFaceError] = useState('');

  useEffect(() => {
    return () => { cancelLoop(); stopStream(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach the stream and start playback only AFTER the <video> has mounted.
  // Assigning srcObject inside startCamera races the render (the <video> only
  // renders once cameraActive is true), leaving the element paused — which on
  // Android shows as a play-button placeholder and feeds no frames to the model.
  useEffect(() => {
    const v = videoRef.current;
    if (cameraActive && stream && v) {
      if (v.srcObject !== stream) v.srcObject = stream;
      const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
      tryPlay();
      v.onloadedmetadata = tryPlay;
      v.oncanplay = tryPlay;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, stream]);

  const handleCheckbox = (key) => setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));

  const cancelLoop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

  const stopStream = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
  };

  const startCamera = async () => {
    setWebcamError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setWebcamError('Webcam access is not available in this browser.');
      return;
    }
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      // The stream is attached to the <video> in an effect once it mounts (see above).
      setStream(currentStream);
      setCameraActive(true);

      setModelStatus('loading');
      ensureFaceModel()
        .then((lm) => { landmarkerRef.current = lm; setModelStatus('ready'); })
        .catch(() => { setModelStatus('error'); setFaceError('The on-device model could not load. You can still use the checklist or the offline demo.'); });

      startLoop();
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        setWebcamError('Camera permission was denied. Open Settings → Apps → Safe Path Mauritius → Permissions → Camera, then try again.');
      } else if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
        setWebcamError('No camera was found on this device. You can still use the offline demo or the indicator checklist below.');
      } else {
        setWebcamError('Unable to access the camera right now. Please allow camera permission when prompted, or use the offline demo below.');
      }
    }
  };

  const stopCamera = () => {
    cancelLoop();
    stopStream();
    setCameraActive(false);
    setFaceVisible(false);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startLoop = () => {
    cancelLoop();
    lastDetectRef.current = 0;
    lastFrameRef.current = { face: false };
    const loop = () => {
      // Wrapped so a single exception can never kill the animation loop
      // (that was making detection stop after the first scan).
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const lm = landmarkerRef.current;
        if (video && canvas && video.readyState >= 2) {
          const now = performance.now();
          // Detect on a fixed time interval. (We do NOT gate on video.currentTime —
          // on a live MediaStream it can stall, which froze detection after a few seconds.)
          if (lm && now - lastDetectRef.current >= DETECT_INTERVAL) {
            lastDetectRef.current = now;
            let ts = now;
            if (ts <= lastTsRef.current) ts = lastTsRef.current + 1; // strictly increasing
            lastTsRef.current = ts;

            const frame = detectFaceFrame(lm, video, ts);
            lastFrameRef.current = frame;

            if (frame.face !== faceVisibleRef.current) { faceVisibleRef.current = frame.face; setFaceVisible(frame.face); }

            const scan = scanRef.current;
            if (scan.active && frame.face) {
              for (const [k, v] of Object.entries(frame.shapes)) scan.totals[k] = (scan.totals[k] || 0) + v;
              scan.frames += 1;
            }
          }

          // Draw the camera frame + box into the canvas every animation frame.
          // (Drawing the video ourselves avoids the Android WebView issue where a
          // <video> hardware surface paints over a canvas overlay, hiding the box.)
          drawFrame(canvas, video, lastFrameRef.current);

          const scan = scanRef.current;
          if (scan.active) {
            const p = Math.min(1, (now - scan.start) / SCAN_MS);
            if (Math.abs(p - progressRef.current) >= 0.04 || p === 1) { progressRef.current = p; setFaceProgress(p); }
            if (now - scan.start >= SCAN_MS) finishScan();
          }
        }
      } catch {
        /* never let the loop die */
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const runFaceScan = () => {
    if (modelStatus !== 'ready') {
      setFaceError('The on-device model is still loading — try again in a moment.');
      return;
    }
    setFaceError(''); setMessage(''); setFaceResult(null);
    setFaceScanning(true); setFaceProgress(0); progressRef.current = 0;
    scanRef.current = { active: true, start: performance.now(), totals: {}, frames: 0 };
  };

  const finishScan = () => {
    const scan = scanRef.current;
    scan.active = false;
    setFaceScanning(false);
    if (scan.frames === 0) {
      setFaceError('No face was detected during the scan. Centre your face in good light and try again.');
      return;
    }
    const avg = {};
    for (const k of Object.keys(scan.totals)) avg[k] = scan.totals[k] / scan.frames;
    const { indicators: ind, evidence, flags } = mapShapesToIndicators(avg);
    setFaceResult({ indicators: ind, evidence, flags, facesSeen: scan.frames });
    setIndicators(intensitiesToIndicators(ind));
    setFaceProgress(1);
  };

  function drawFrame(canvas, video, frame) {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch || !video.videoWidth) return;
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    const ctx = canvas.getContext('2d');

    // draw the live camera frame into the canvas (object-fit: cover math)
    const vw = video.videoWidth, vh = video.videoHeight;
    const scale = Math.max(cw / vw, ch / vh);
    const dispW = vw * scale, dispH = vh * scale;
    const offX = (cw - dispW) / 2, offY = (ch - dispH) / 2;
    ctx.clearRect(0, 0, cw, ch);
    try { ctx.drawImage(video, offX, offY, dispW, dispH); } catch { /* frame not ready */ }

    if (!frame.face || !frame.box) return;

    const { minX, minY, maxX, maxY } = frame.box;
    const padX = (maxX - minX) * 0.06, padY = (maxY - minY) * 0.09;
    let x = offX + (minX - padX) * dispW;
    let y = offY + (minY - padY) * dispH;
    let w = (maxX - minX + 2 * padX) * dispW;
    let h = (maxY - minY + 2 * padY) * dispH;

    const green = '#27e06a';
    // bounding box
    ctx.lineWidth = 4;
    ctx.strokeStyle = green;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    roundRect(ctx, x, y, w, h, 12);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // emotion label pill above the box
    const label = `${frame.emotion.label}  ${Math.round(frame.emotion.score * 100)}%`;
    ctx.font = '600 15px Inter, system-ui, sans-serif';
    const tw = ctx.measureText(label).width;
    const padTextX = 11, pillH = 26;
    const pillW = tw + padTextX * 2;
    let px = x;
    let py = y - pillH - 6;
    if (py < 2) py = y + 6; // if no room above, place inside top
    if (px + pillW > cw) px = cw - pillW - 2;
    if (px < 2) px = 2;
    ctx.fillStyle = green;
    roundRect(ctx, px, py, pillW, pillH, 13);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px + padTextX, py + pillH / 2 + 1);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!consentGiven) {
      // Don't fail silently — take the user to the consent step.
      setMessage('Please give consent first — sending you to the consent page.');
      setTimeout(() => navigate('/consent'), 600);
      return;
    }
    setMessage(''); setLoading(true);
    try {
      const result = await analyzeIndicators(indicators);
      const usedFace = faceResult && faceResult.flags.length > 0;
      // Record this check-in on-device so the app can show trends over time.
      appendCheckin({
        score: result.score,
        concernLevel: result.concern_level,
        signals: faceResult ? faceResult.indicators : null,
        source: usedFace ? 'facial' : 'manual'
      });
      onResult({
        concernLevel: result.concern_level,
        score: result.score,
        flags: usedFace ? faceResult.flags : result.reasons,
        intensities: faceResult ? faceResult.indicators : null,
        explanation: usedFace
          ? 'Derived from on-device facial-expression analysis. The video was processed entirely on this device and never uploaded. This is not a diagnosis — human review is required before any action.'
          : result.explanation
      });
      navigate('/results');
    } finally {
      setLoading(false);
    }
  };

  const runOfflineDemo = () => { onResult(offlineDemoTemplate); navigate('/results'); };

  const modelHint = modelStatus === 'loading'
    ? 'Loading on-device model…'
    : modelStatus === 'ready'
      ? (faceVisible ? 'Face detected — ready to analyze.' : 'Looking for a face…')
      : '';

  return (
    <div className="page-card">
      <div className="section-header">
        <div>
          <h1>Behavioural &amp; emotional check-in</h1>
          <p className="text-muted">
            A short, on-device facial-expression reading estimates emotional signals and prepares them for human review. It is not a diagnosis and does not detect substance use.
          </p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <h3>On-device facial analysis</h3>
        <p className="text-muted">Start the camera and run a 3-second reading. Everything is processed locally.</p>

        <div className="video-panel">
          <div className="video-wrap">
            {/* hidden source — the canvas below draws its frames (reliable on Android) */}
            <video ref={videoRef} autoPlay playsInline muted className="video-src" style={{ display: cameraActive ? 'block' : 'none' }} />
            {cameraActive ? (
              <canvas ref={canvasRef} className="face-canvas" />
            ) : (
              <div className="video-placeholder">Camera preview will appear here.</div>
            )}
            {cameraActive && modelHint && <div className="live-hint">{modelHint}</div>}
          </div>

          <div className="privacy-chip" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 5 6v5.5c0 4 3 7 7 8.5 4-1.5 7-4.5 7-8.5V6l-7-3Z" /><path d="m9 11.5 2 2 4-4" />
            </svg>
            Processed on your device · no video is uploaded or stored
          </div>

          <div className="camera-actions">
            {!cameraActive ? (
              <button type="button" onClick={startCamera} className="secondary">Start camera</button>
            ) : (
              <button type="button" onClick={stopCamera} className="secondary">Stop camera</button>
            )}
            <button type="button" onClick={runFaceScan} disabled={!cameraActive || faceScanning || modelStatus !== 'ready'}>
              {faceScanning ? `Reading… ${Math.round(faceProgress * 100)}%` : 'Analyze expression'}
            </button>
          </div>

          {faceScanning && (
            <div className="meter low" aria-label="Scan progress">
              <span style={{ width: `${Math.round(faceProgress * 100)}%`, animation: 'none' }} />
            </div>
          )}
        </div>

        {webcamError && <div className="alert-soft">{webcamError}</div>}
        {faceError && <div className="alert-soft">{faceError}</div>}

        {faceResult && (
          <div className="card" style={{ marginTop: '18px' }}>
            <h4 style={{ margin: '0 0 4px' }}>Detected expression signals</h4>
            <p className="text-muted" style={{ margin: '0 0 14px', fontSize: '0.85rem' }}>
              Averaged over {faceResult.facesSeen} frames. Each signal shows the facial cues it came from — you can review and edit them below.
            </p>
            {indicatorOptions.map((item) => {
              const v = faceResult.indicators[item.key] || 0;
              const pct = Math.round(v * 100);
              const why = faceResult.evidence[item.key];
              return (
                <div className="signal-row" key={item.key}>
                  <div className="signal-head">
                    <span>{INDICATOR_LABELS[item.key] || item.label}</span>
                    <span className="tnum">{pct}%</span>
                  </div>
                  <div className="signal-bar"><span style={{ width: `${pct}%` }} /></div>
                  {why && <div className="signal-why">from {why}</div>}
                </div>
              );
            })}
          </div>
        )}

        <div className="card" style={{ marginTop: '18px' }}>
          <h4 style={{ margin: '0 0 4px' }}>Indicators for review {faceResult ? '(auto-filled — editable)' : ''}</h4>
          <p className="text-muted" style={{ margin: '0 0 12px', fontSize: '0.85rem' }}>
            {faceResult ? 'Confirm or adjust before sending to a human reviewer.' : 'Run a scan above, or set these manually to model possible observations.'}
          </p>
          {indicatorOptions.map((item) => (
            <label key={item.key} style={{ display: 'block', marginBottom: '10px' }}>
              <input type="checkbox" checked={Boolean(indicators[item.key])} onChange={() => handleCheckbox(item.key)} />
              {item.label}
            </label>
          ))}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button type="submit" disabled={loading}>{loading ? 'Analyzing…' : 'Run analysis'}</button>
          <button type="button" className="secondary" onClick={() => navigate('/consent')}>Back to consent</button>
          <button type="button" className="secondary" onClick={runOfflineDemo}>Run offline demo</button>
        </div>
      </form>

      {message && <div className="alert-soft">{message}</div>}

      <div className="card note-box">
        <strong>How this works:</strong> the facial reading runs locally using an on-device model
        (MediaPipe). It estimates emotional/behavioural <em>expression</em> signals only — never a
        substance-use verdict — and every result is routed to a trained human reviewer who makes any decision.
      </div>
    </div>
  );
}
