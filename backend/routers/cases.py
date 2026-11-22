from fastapi import APIRouter, HTTPException
from ..database import get_connection, record_audit

router = APIRouter(prefix='/cases', tags=['cases'])

@router.get('/')
def list_cases():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM cases ORDER BY concern_level DESC, status')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.post('/')
def create_case(payload: dict):
    """Create a reviewable case from a completed check-in, closing the loop
    between the on-device analysis and the human-review queue."""
    concern = payload.get('concern_level', 'Low')
    score = payload.get('score')
    indicators = payload.get('indicators', '')
    name = payload.get('name') or 'Self check-in'
    summary = payload.get('summary') or (
        f'Self check-in scored {score}/100 ({concern} concern). '
        'Routed to a human reviewer — no automated action taken.'
    )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(1) AS n FROM cases")
    case_id = f"C-{cursor.fetchone()['n'] + 1:03d}"
    cursor.execute(
        'INSERT INTO cases (id, name, concern_level, status, summary, indicators, reviewer_notes, referral) '
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (case_id, name, concern, 'Pending', summary, indicators, '', '')
    )
    conn.commit()
    record_audit(conn, 'subject', 'case_created', case_id, f'score={score}; level={concern}')
    conn.close()
    return {'id': case_id, 'concern_level': concern, 'status': 'Pending'}

@router.post('/{case_id}/action')
def review_case(case_id: str, action: dict):
    if action.get('status') not in {'Approved', 'Held', 'Dismissed'}:
        raise HTTPException(status_code=400, detail='Invalid action')

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM cases WHERE id = ?', (case_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail='Case not found')
    cursor.execute(
        'UPDATE cases SET status = ?, reviewer_notes = ?, referral = ? WHERE id = ?',
        (action.get('status'), action.get('reviewer_notes', ''), action.get('referral', ''), case_id)
    )
    conn.commit()

    # Record the human-review decision in the audit trail.
    actor_role = action.get('actor_role', 'reviewer')
    referral = action.get('referral', '')
    details = f"status={action.get('status')}"
    if referral:
        details += f"; referral={referral}"
    record_audit(conn, actor_role, 'review_action', case_id, details)

    conn.close()
    return {'status': 'updated', 'case_id': case_id}
