/* Demo fallback data — shown on the staff screens when the backend isn't
   reachable (e.g. the phone app, or before `uvicorn` is started), so the
   demo always has something to show. Shape matches the backend API
   (snake_case, indicators as a single string). */

export const sampleCases = [
  {
    id: 'C-001',
    name: 'Maya P.',
    status: 'Flagged',
    concern_level: 'Medium',
    indicators: 'Stress signals: 54%; Fatigue: 38%; Withdrawal: 31%',
    summary: 'Self check-in showed elevated stress and fatigue over two sessions. Recommend a supportive outreach conversation.',
    reviewer_notes: '',
    referral: ''
  },
  {
    id: 'C-002',
    name: 'Nicolas A.',
    status: 'Pending',
    concern_level: 'High',
    indicators: 'Agitation: 67%; Stress signals: 61%; Avoidant gaze: 44%',
    summary: 'Multiple high signals across recent check-ins, trend rising. Human review required before any action.',
    reviewer_notes: '',
    referral: ''
  },
  {
    id: 'C-003',
    name: 'Faiza R.',
    status: 'Held',
    concern_level: 'Low',
    indicators: 'Sadness or low mood: 22%; Fatigue: 18%',
    summary: 'Low concern. Monitor over the next week; no immediate referral recommended.',
    reviewer_notes: 'Offer a supportive check-in with the school support officer.',
    referral: 'School support officer'
  },
  {
    id: 'C-004',
    name: 'Check-in #3D7A',
    status: 'Pending',
    concern_level: 'Medium',
    indicators: 'Stress signals: 49%; Avoidant gaze: 27%',
    summary: 'Anonymous self check-in scored 52/100 (Medium concern). Routed for human review.',
    reviewer_notes: '',
    referral: ''
  },
  {
    id: 'C-005',
    name: 'Devesh K.',
    status: 'Approved',
    concern_level: 'High',
    indicators: 'Stress signals: 72%; Agitation: 58%; Withdrawal: 40%',
    summary: 'High concern confirmed on review. Referred to community support and family outreach.',
    reviewer_notes: 'Spoke with student; referral accepted.',
    referral: 'Community support NGO'
  },
  {
    id: 'C-006',
    name: 'Priya S.',
    status: 'Flagged',
    concern_level: 'Medium',
    indicators: 'Fatigue: 44%; Sadness or low mood: 36%',
    summary: 'Persistent fatigue and low-mood signals across three check-ins.',
    reviewer_notes: '',
    referral: ''
  }
];

export const sampleAudit = [
  { id: 6, created_at: '2026-06-24 09:12', actor_role: 'reviewer', action: 'review_action', case_id: 'C-005', details: 'status=Approved; referral=Community support NGO' },
  { id: 5, created_at: '2026-06-24 09:05', actor_role: 'subject', action: 'case_created', case_id: 'C-004', details: 'score=52; level=Medium' },
  { id: 4, created_at: '2026-06-23 16:40', actor_role: 'reviewer', action: 'review_action', case_id: 'C-003', details: 'status=Held' },
  { id: 3, created_at: '2026-06-23 16:31', actor_role: 'subject', action: 'consent_granted', case_id: null, details: 'scope=on-device facial-expression check-in' },
  { id: 2, created_at: '2026-06-23 11:02', actor_role: 'admin', action: 'user_login', case_id: null, details: 'email=admin@safepath.mu' },
  { id: 1, created_at: '2026-06-23 10:58', actor_role: 'admin', action: 'user_registered', case_id: null, details: 'email=admin@safepath.mu' }
];

export const sampleConsentCount = 7;
