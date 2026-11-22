const commitments = [
  {
    title: 'Support, not diagnosis',
    body: 'We surface emotional/behavioural expression signals for a trained human to review. The app never diagnoses anything and never detects or confirms substance use.'
  },
  {
    title: 'On-device privacy',
    body: 'Facial analysis runs entirely on your device. No image or video is ever uploaded or stored — only derived, aggregate signals exist, and only for the session.'
  },
  {
    title: 'Explicit, revocable consent',
    body: 'Nothing is analysed before you agree. Consent is recorded (timestamp + policy version only — no personal data) and can be withdrawn at any time.'
  },
  {
    title: 'Human in the loop',
    body: 'No automated action is ever taken. Every result is reviewed by a person who decides whether to offer supportive, non-punitive follow-up.'
  },
  {
    title: 'Transparent by design',
    body: 'Every signal shows the facial cues behind it, and the full indicator mapping is published in our model card. Nothing is a black box.'
  },
  {
    title: 'Fairness we own',
    body: 'Facial-expression reading can misjudge people by skin tone, age, culture, and neurodivergence. Outputs stay non-diagnostic and a human reviewer treats them as fallible prompts, not facts.'
  }
];

const prohibited = [
  'Medical or psychiatric diagnosis',
  'Law enforcement, surveillance, or punitive action',
  'Insurance, employment, or eligibility decisions',
  'Covert, mandatory, or non-consensual scanning',
  'Any decision affecting a person without human review'
];

export default function EthicsPage() {
  return (
    <div className="page-card">
      <div className="hero">
        <div>
          <span className="eyebrow">Our commitments</span>
          <h1 className="page-title">Ethics &amp; privacy</h1>
          <p className="page-copy">
            This is a proof-of-concept built around a simple rule: technology should help us offer
            earlier, kinder support — never judge, label, or police anyone.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {commitments.map((c) => (
          <div className="card" key={c.title}>
            <h3 style={{ marginTop: 0 }}>{c.title}</h3>
            <p className="text-muted" style={{ marginBottom: 0 }}>{c.body}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h2 style={{ marginTop: 0 }}>What this must never be used for</h2>
        <ul>
          {prohibited.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </div>

      <div className="card note-box">
        Full detail lives in our <strong>model card</strong> and <strong>ethics statement</strong>
        {' '}(<code>docs/MODEL_CARD.md</code>, <code>docs/ETHICS.md</code>), including the complete
        facial-signal mapping, known failure modes, and data-handling commitments.
      </div>
    </div>
  );
}
