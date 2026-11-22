def seed_database(conn):
    cursor = conn.cursor()
    cases = [
        (
            'C-001',
            'Maya Pierre',
            'Medium',
            'Flagged',
            'Possible behavioural risk indicators observed in a short wellbeing check-in. Recommend human review and supportive outreach.',
            'Elevated stress signals; Fatigue; Withdrawal in speech',
            'Contact school counselor for a follow-up conversation.',
            'Community support NGO'
        ),
        (
            'C-002',
            'Nicolas Arya',
            'High',
            'Pending',
            'Multiple signals of worry and agitation. Human review required before any action.',
            'Repeated agitation; Unusual emotional pattern; Low engagement',
            'Schedule an in-person review meeting with the student.',
            'Mental health counselor'
        ),
        (
            'C-003',
            'Faiza Rahman',
            'Low',
            'Held',
            'Low concern but monitor behaviour over the next week. No immediate referral recommended.',
            'Slight sadness; Fatigue',
            'Offer supportive check-in with school support officer.',
            'School support officer'
        )
    ]

    organizations = [
        ('Community NGO', 'Local support organization for early intervention and safe referral.', 'contact@communityngo.mu'),
        ('School counselor', 'In-school emotional support for students.', 'school.counselor@safepath.mu'),
        ('Mental health counselor', 'Private counseling for early concern review.', 'mhc@safepath.mu')
    ]

    cursor.executemany(
        'INSERT OR IGNORE INTO cases (id, name, concern_level, status, summary, indicators, reviewer_notes, referral) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        cases
    )
    cursor.executemany(
        'INSERT INTO organizations (name, description, contact) VALUES (?, ?, ?)',
        organizations
    )
    conn.commit()
