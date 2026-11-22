import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCases, reviewCase } from '../api';
import { sampleCases } from '../data/sampleCases';

const referrals = [
  { value: 'Community support NGO', label: 'Community NGO' },
  { value: 'School counselor', label: 'School counselor' },
  { value: 'Mental health counselor', label: 'Mental health counselor' },
  { value: 'Family outreach', label: 'Family outreach' }
];

export default function ReferralPage({ userRole }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(referrals[0].value);
  const [message, setMessage] = useState('');
  const [usingSample, setUsingSample] = useState(false);

  const isStaff = userRole === 'reviewer' || userRole === 'admin';

  useEffect(() => {
    if (!isStaff) return;
    const apply = (data, sample) => {
      setCases(data);
      setUsingSample(sample);
      if (data.length > 0) setSelectedCaseId(data[0].id);
    };
    fetchCases()
      .then((data) => (Array.isArray(data) && data.length) ? apply(data, false) : apply(sampleCases, true))
      .catch(() => apply(sampleCases, true));
  }, [isStaff]);

  if (!isStaff) {
    return (
      <div className="page-card">
        <h1>Referral workflow</h1>
        <p className="text-muted">This area is for trained staff. Please sign in to route a case to a support partner.</p>
        <Link to="/login"><button type="button" style={{ marginTop: '12px' }}>Staff sign in</button></Link>
      </div>
    );
  }

  const handleRecommend = async () => {
    if (!selectedCaseId) {
      setMessage('Select a case first.');
      return;
    }

    try {
      await reviewCase(selectedCaseId, {
        status: 'Approved',
        reviewer_notes: `Referral recommended to ${selectedReferral}.`,
        referral: selectedReferral
      });
      setMessage(`Referral recommendation sent for case ${selectedCaseId}.`);
      setCases((prev) => prev.map((item) => item.id === selectedCaseId ? { ...item, status: 'Approved', referral: selectedReferral } : item));
    } catch (error) {
      setMessage(error.message || 'Unable to send referral recommendation.');
    }
  };

  return (
    <div className="page-card">
      <div className="section-header">
        <div>
          <h1>Referral workflow</h1>
          <p className="text-muted">
            Use this panel to route a flagged case to the recommended support provider with a careful, privacy-first summary.
          </p>
        </div>
      </div>

      <div className="card note-box">
        <p>
          No referral is sent automatically. This dashboard is built for human review and secure recommendation only.
        </p>
      </div>

      {usingSample && (
        <div className="alert-soft">
          Showing sample cases for the demo — start the backend to route live records.
        </div>
      )}
      {message && <div className="alert-soft">{message}</div>}

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3>Select case and referral</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <label>
            Case record
            <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)} style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '14px', border: '1px solid #d9e2ef' }}>
              {cases.map((item) => (
                <option key={item.id} value={item.id}>{`${item.id} — ${item.name} (${item.status})`}</option>
              ))}
            </select>
          </label>

          <label>
            Recommended support partner
            <select value={selectedReferral} onChange={(e) => setSelectedReferral(e.target.value)} style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '14px', border: '1px solid #d9e2ef' }}>
              {referrals.map((ref) => (
                <option key={ref.value} value={ref.value}>{ref.label}</option>
              ))}
            </select>
          </label>

          <button type="button" onClick={handleRecommend}>Recommend referral</button>
        </div>
      </div>

      <div className="grid-2">
        {cases.map((item) => (
          <div className="card" key={item.id}>
            <h3>{item.name}</h3>
            <p className="text-muted">{item.summary}</p>
            <p>
              <strong>Status:</strong> {item.status}
            </p>
            <p>
              <strong>Current referral:</strong> {item.referral || 'None'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
