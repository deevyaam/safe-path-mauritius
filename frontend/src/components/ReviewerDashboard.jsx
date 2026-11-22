import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCases, reviewCase } from '../api';
import { sampleCases } from '../data/sampleCases';

const defaultStatuses = ['Approved', 'Held', 'Dismissed'];

export default function ReviewerDashboard({ userRole }) {
  const [cases, setCases] = useState([]);
  const [formState, setFormState] = useState({});
  const [message, setMessage] = useState('');
  const [usingSample, setUsingSample] = useState(false);

  const isStaff = userRole === 'reviewer' || userRole === 'admin';

  useEffect(() => {
    if (!isStaff) return;
    fetchCases()
      .then((data) => {
        if (Array.isArray(data) && data.length) { setCases(data); setUsingSample(false); }
        else { setCases(sampleCases); setUsingSample(true); }
      })
      .catch(() => { setCases(sampleCases); setUsingSample(true); });
  }, [isStaff]);

  if (!isStaff) {
    return (
      <div className="page-card">
        <h1>Reviewer dashboard</h1>
        <p className="text-muted">This area is for trained staff. Please sign in to review flagged cases.</p>
        <Link to="/login"><button type="button" style={{ marginTop: '12px' }}>Staff sign in</button></Link>
      </div>
    );
  }

  const handleInput = (caseId, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [caseId]: { ...prev[caseId], [field]: value }
    }));
  };

  const handleSave = async (caseId) => {
    const caseForm = formState[caseId] || {};
    if (!caseForm.status) {
      setMessage('Please select a review status before saving.');
      return;
    }

    try {
      await reviewCase(caseId, {
        status: caseForm.status,
        reviewer_notes: caseForm.reviewer_notes || '',
        referral: caseForm.referral || '',
        actor_role: userRole
      });
      setCases((prev) => prev.map((item) => item.id === caseId ? { ...item, status: caseForm.status, reviewer_notes: caseForm.reviewer_notes || item.reviewer_notes, referral: caseForm.referral || item.referral } : item));
      setMessage('Review action saved successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to save review action.');
    }
  };

  return (
    <div className="page-card">
      <div className="section-header">
        <div>
          <h1>Reviewer dashboard</h1>
          <p className="text-muted">
            Review flagged cases, add notes, and recommend referral or hold actions for human-centred support.
          </p>
        </div>
      </div>

      {usingSample && (
        <div className="alert-soft">
          Showing sample cases for the demo — start the backend (and connect to it) to see live records.
        </div>
      )}
      {message && <div className="alert-soft">{message}</div>}

      <div className="card">
        <h2>Flagged cases</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Status</th>
                <th>Concern level</th>
                <th>Referral</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.status}</td>
                  <td>{item.concern_level || item.concernLevel}</td>
                  <td>{item.referral || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        {cases.map((item) => {
          const form = formState[item.id] || {};
          return (
            <div className="card" key={item.id}>
              <h3>{item.name}</h3>
              <p className="text-muted">{item.summary}</p>
              <p>
                <strong>Indicators:</strong> {item.indicators || item.indicators?.join(', ')}
              </p>
              <p>
                <strong>Reviewer notes:</strong>
              </p>
              <textarea
                rows="3"
                style={{ width: '100%', borderRadius: '14px', border: '1px solid #d9e2ef', padding: '10px' }}
                defaultValue={item.reviewer_notes || ''}
                onChange={(e) => handleInput(item.id, 'reviewer_notes', e.target.value)}
              />
              <div style={{ marginTop: '12px' }}>
                <label>
                  Status:
                  <select value={form.status || item.status} onChange={(e) => handleInput(item.id, 'status', e.target.value)} style={{ marginLeft: '8px', borderRadius: '12px', padding: '8px' }}>
                    <option value="">Select</option>
                    {defaultStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label>
                  Referral recommendation:
                  <input
                    type="text"
                    defaultValue={item.referral || ''}
                    onChange={(e) => handleInput(item.id, 'referral', e.target.value)}
                    style={{ width: '100%', marginTop: '8px', borderRadius: '14px', border: '1px solid #d9e2ef', padding: '10px' }}
                  />
                </label>
              </div>
              <button style={{ marginTop: '16px' }} onClick={() => handleSave(item.id)}>
                Save review action
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
