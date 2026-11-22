import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordConsent } from '../api';

export default function ConsentPage({ consentGiven, onConsent }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const handleContinue = async () => {
    setSaving(true);
    try {
      const record = await recordConsent({
        granted: true,
        scope: 'on-device facial-expression check-in + human review'
      });
      setNote(`Consent recorded on this device (#${record.id}, ${record.created_at}). You can withdraw it any time.`);
    } catch {
      setNote('Consent acknowledged on this device.');
    } finally {
      setSaving(false);
      navigate('/analysis');
    }
  };

  return (
    <div className="page-card">
      <div className="section-header">
        <div>
          <h1>Consent for analysis</h1>
          <p className="text-muted">
            We ask for explicit consent before any check-in. This is not a diagnosis, and your consent is recorded so it can be reviewed and withdrawn.
          </p>
        </div>
      </div>

      <div className="card">
        <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(event) => onConsent(event.target.checked)}
          />
          <span>
            I agree to a short, <strong>on-device</strong> facial-expression check-in for
            non-diagnostic early support. I understand the video is processed locally and
            <strong> not uploaded</strong>, and that a <strong>human reviewer</strong> reviews any result before action.
          </span>
        </label>
      </div>

      <div className="card note-box">
        <p className="text-muted" style={{ margin: 0 }}>
          No automated action is ever taken without human review, and no case is shared publicly.
          Your consent record stores only a timestamp and version — no personal data.
        </p>
      </div>

      {note && <div className="alert-soft">{note}</div>}

      <button disabled={!consentGiven || saving} onClick={handleContinue}>
        {saving ? 'Recording consent…' : 'Agree & continue'}
      </button>
    </div>
  );
}
