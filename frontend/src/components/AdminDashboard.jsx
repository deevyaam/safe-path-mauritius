import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAuditLog, fetchConsents } from '../api';
import { sampleAudit, sampleConsentCount } from '../data/sampleCases';

const ACTION_LABEL = {
  review_action: 'Human review decision',
  consent_granted: 'Consent granted',
  consent_withdrawn: 'Consent withdrawn',
  case_created: 'Case created',
  user_login: 'Staff sign-in',
  user_registered: 'Staff registered'
};

export default function AdminDashboard({ userRole }) {
  const [audit, setAudit] = useState([]);
  const [consentCount, setConsentCount] = useState(null);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') return;
    fetchAuditLog(50)
      .then((data) => {
        if (Array.isArray(data) && data.length) { setAudit(data); setUsingSample(false); }
        else { setAudit(sampleAudit); setUsingSample(true); }
      })
      .catch(() => { setAudit(sampleAudit); setUsingSample(true); });
    fetchConsents()
      .then((d) => setConsentCount(d.records.length))
      .catch(() => setConsentCount(sampleConsentCount));
  }, [userRole]);

  if (userRole !== 'admin') {
    return (
      <div className="page-card">
        <h1>Admin dashboard</h1>
        <p className="text-muted">Oversight tools are for administrators. Please sign in with an admin account.</p>
        <Link to="/login"><button type="button" style={{ marginTop: '12px' }}>Staff sign in</button></Link>
      </div>
    );
  }

  return (
    <div className="page-card">
      <div className="section-header">
        <div>
          <h1>Admin &amp; oversight</h1>
          <p className="text-muted">
            Governance view: consent records and a full audit trail of every human-review action.
          </p>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h4 style={{ margin: '0 0 6px' }}>Audit entries</h4>
          <span className="score-num tnum" style={{ fontSize: '2rem' }}>{audit.length}</span>
        </div>
        <div className="card">
          <h4 style={{ margin: '0 0 6px' }}>Consent records</h4>
          <span className="score-num tnum" style={{ fontSize: '2rem' }}>{consentCount ?? '—'}</span>
        </div>
        <div className="card">
          <h4 style={{ margin: '0 0 6px' }}>Support partners</h4>
          <span className="score-num tnum" style={{ fontSize: '2rem' }}>3</span>
        </div>
      </div>

      {usingSample && (
        <div className="alert-soft">
          Showing a sample audit trail for the demo — start the backend to see live entries.
        </div>
      )}

      <div className="card">
        <h2>Audit trail</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Every consent event and reviewer decision is recorded here — proof that no action is automated or hidden.
        </p>
        {audit.length === 0 ? (
          <p className="text-muted">No entries yet. Record a consent or take a reviewer action to see the trail populate.</p>
        ) : (
          <div className="audit-list">
            {audit.map((row) => (
              <div className="audit-item" key={row.id}>
                <div className="audit-top">
                  <span className="audit-action">{ACTION_LABEL[row.action] || row.action}</span>
                  <span className="audit-when tnum">{row.created_at}</span>
                </div>
                <div className="audit-meta">
                  <span className="audit-actor">{row.actor_role}</span>
                  {row.case_id && <span className="audit-case">{row.case_id}</span>}
                </div>
                {row.details && <div className="audit-details">{row.details}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card note-box">
        <strong>Data minimization:</strong> consent records store only a timestamp and policy
        version — never names, faces, or video. Facial analysis runs on the user's device and
        is never transmitted or retained.
      </div>
    </div>
  );
}
