import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../api';
import { loadHistory, computeTrend } from '../history';
import { CRISIS_RESOURCES, SUPPORT_RESOURCES } from '../data/resources';
import { INDICATOR_LABELS } from '../faceAnalysis';

const defaultResult = {
  concernLevel: 'Low',
  score: 28,
  flags: ['Mild sadness pattern observed', 'No high-risk agitation detected'],
  explanation: 'The assessment shows mild concern signals only. A human reviewer should confirm whether support is needed.'
};

function Sparkline({ scores }) {
  const w = 260, h = 56, pad = 6;
  const max = 100, min = 0;
  const pts = scores.map((s, i) => {
    const x = pad + (i * (w - 2 * pad)) / Math.max(1, scores.length - 1);
    const y = pad + (1 - (s - min) / (max - min)) * (h - 2 * pad);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Recent concern scores">
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--primary-strong)" />}
    </svg>
  );
}

export default function ResultsPage({ result }) {
  const navigate = useNavigate();
  const data = result || defaultResult;
  const badgeClass = data.concernLevel.toLowerCase();
  const isHigh = data.concernLevel === 'High';

  const history = useMemo(() => loadHistory(), []);
  const trend = useMemo(() => computeTrend(history), [history]);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');

  const handleSendToReviewer = async () => {
    setSending(true);
    let trendNote = '';
    if (trend && trend.direction === 'rising') trendNote = ' Trend: concern signals rising across recent check-ins.';
    const created = await createCase({
      concern_level: data.concernLevel,
      score: data.score,
      indicators: (data.flags || []).join('; '),
      summary: `Self check-in scored ${data.score}/100 (${data.concernLevel} concern). Routed for human review.${trendNote}`
    });
    setSending(false);
    if (created) setSent(`Case ${created.id} created in the reviewer queue.`);
    setTimeout(() => navigate('/reviewer'), created ? 700 : 0);
  };

  return (
    <div className="page-card">
      <div className="section-header">
        <div>
          <h1>Check-in results</h1>
          <p className="text-muted">
            An explainable concern-level summary. It is not a diagnosis — every result is reviewed by a person.
          </p>
        </div>
        <span className={`badge ${badgeClass}`}>{data.concernLevel} concern</span>
      </div>

      {isHigh && (
        <div className="crisis-card">
          <div className="crisis-head">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20s-6-4.2-6-8.5A3.5 3.5 0 0 1 12 9a3.5 3.5 0 0 1 6 2.5C18 15.8 12 20 12 20Z" />
            </svg>
            <strong>You don’t have to go through this alone</strong>
          </div>
          <p>These signals suggest a harder stretch. Reaching out is a strong, healthy step — support is free and confidential.</p>
          <div className="resource-list">
            {CRISIS_RESOURCES.map((r) => (
              <a key={r.name} className="resource" href={`tel:${r.tel}`}>
                <span className="resource-name">{r.name}</span>
                <span className="resource-phone">{r.phone}</span>
                <span className="resource-desc">{r.desc}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h2>Summary</h2>
          <div className="score-row">
            <span className="score-num">{data.score}</span>
            <span className="score-den">/ 100 concern score</span>
          </div>
          <div className={`meter ${badgeClass}`}>
            <span style={{ width: `${Math.max(0, Math.min(100, data.score))}%` }} />
          </div>
          <p style={{ marginTop: '14px' }}>{data.explanation}</p>
        </div>
        <div className="card">
          <h2>Observed indicators</h2>
          <ul>
            {data.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      </div>

      {trend && (
        <div className="card">
          <h2>Your check-in trend</h2>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Based on {trend.count} check-ins kept privately on this device. Tracking change over time is how early support works.
          </p>
          <Sparkline scores={trend.scores} />
          <div className={`trend-pill ${trend.direction}`}>
            <span className="trend-glyph">{trend.direction === 'rising' ? '▲' : trend.direction === 'easing' ? '▼' : '◆'}</span>
            {trend.message}
          </div>
          {trend.perSignal.length > 0 && (
            <div className="drift-grid">
              {trend.perSignal.map((s) => (
                <div className="drift" key={s.key}>
                  <span className={`drift-arrow ${s.dir}`}>{s.dir === 'up' ? '↑' : s.dir === 'down' ? '↓' : '→'}</span>
                  <span>{INDICATOR_LABELS[s.key] || s.key}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>Support resources</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>Free, confidential help in Mauritius — for you or someone you care about.</p>
        <div className="resource-list">
          {[...CRISIS_RESOURCES, ...SUPPORT_RESOURCES].map((r) => (
            r.tel ? (
              <a key={r.name} className="resource" href={`tel:${r.tel}`}>
                <span className="resource-name">{r.name}</span>
                <span className="resource-phone">{r.phone}</span>
                <span className="resource-desc">{r.desc}</span>
              </a>
            ) : (
              <div key={r.name} className="resource">
                <span className="resource-name">{r.name}</span>
                <span className="resource-desc">{r.desc}{r.note ? ` (${r.note})` : ''}</span>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="card note-box">
        <strong>Important:</strong> These findings are based on early behavioural and emotional indicators.
        This is not a diagnosis, and any referral decision is made by trained staff.
      </div>

      {sent && <div className="alert-soft">{sent}</div>}

      <button onClick={handleSendToReviewer} disabled={sending}>
        {sending ? 'Sending…' : 'Send to reviewer dashboard'}
      </button>
    </div>
  );
}
