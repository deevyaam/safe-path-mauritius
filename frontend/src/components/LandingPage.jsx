import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="page-card">
      <div className="hero">
        <div>
          <span className="eyebrow">Consent-first · Human-reviewed</span>
          <h1 className="page-title">Safe Path Mauritius</h1>
          <p className="page-copy">
            A privacy-first early support platform for communities. It offers consent-driven behavioural and emotional screening, explains possible concern indicators, and connects at-risk cases with human-reviewed support pathways.
          </p>
        </div>
        <div className="card note-box">
          <p className="text-muted">
            This system supports early intervention and safer communities. It is not a diagnosis tool and does not confirm drug use. Every alert requires human review.
          </p>
        </div>
        <Link to="/ethics" className="text-link">Read our ethics &amp; privacy commitments →</Link>
      </div>

      <div className="grid-3">
        <div className="card">
          <h2>Mission</h2>
          <p className="text-muted">
            Help educators, counselors, and NGOs identify early behavioural risk indicators responsibly, so support can be offered before challenges escalate.
          </p>
        </div>
        <div className="card">
          <h2>Ethical approach</h2>
          <p className="text-muted">
            Consent, privacy, transparency, and human oversight are built into every step. No automated punitive actions and no public sharing of sensitive cases.
          </p>
        </div>
        <div className="card">
          <h2>Demo-ready features</h2>
          <p className="text-muted">
            Landing page, consent workflow, analysis simulation, explainable results, reviewer dashboard, referral workflow, and admin management.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Key strengths</h3>
          <ul>
            <li>Consent-first analysis</li>
            <li>Privacy-first design</li>
            <li>Clear non-diagnostic messaging</li>
            <li>Human-in-the-loop review and referral</li>
          </ul>
        </div>
        <div className="card">
          <h3>How it works</h3>
          <ol>
            <li>Read the mission and ethics.</li>
            <li>Give consent before analysis.</li>
            <li>Upload or record a short clip.</li>
            <li>Review scores and indicators.</li>
            <li>Assign support referrals with human oversight.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
