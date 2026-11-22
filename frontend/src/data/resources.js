/* Support resources surfaced to users (works offline, on-device).
   Crisis numbers below are verified, well-known Mauritius lines.
   Specialist treatment orgs are listed as pathways — confirm their
   current public contact details before any real-world deployment. */

export const CRISIS_RESOURCES = [
  {
    name: 'Befrienders Mauritius',
    desc: 'Free, confidential emotional support — every day, by phone and SMS.',
    phone: '800 9393',
    tel: '8009393'
  },
  {
    name: 'Police emergency',
    desc: 'Immediate danger or risk to life.',
    phone: '999',
    tel: '999'
  },
  {
    name: 'Ambulance — SAMU',
    desc: 'Medical emergency / urgent help.',
    phone: '114',
    tel: '114'
  }
];

export const SUPPORT_RESOURCES = [
  {
    name: 'NATReSA',
    desc: 'National Agency for the Treatment and Rehabilitation of Substance Abusers — government treatment, counselling and rehabilitation services.',
    note: 'Confirm current contact details before deployment.',
    verify: true
  },
  {
    name: 'Idrice Goomany Centre',
    desc: 'Substance-use treatment and harm-reduction services (Port Louis).',
    note: 'Confirm current contact details before deployment.',
    verify: true
  },
  {
    name: 'Your GP or nearest health centre',
    desc: 'A doctor can arrange confidential support and a referral to specialist services.',
  }
];
