from fastapi import APIRouter
from ..database import get_connection, record_audit

router = APIRouter(prefix='/consent', tags=['consent'])

CONSENT_VERSION = '2026-06-v1'


@router.post('/')
def record_consent(payload: dict):
    """Store an explicit, timestamped consent record. We deliberately keep
    NO personal data here — only that consent (for a stated scope) was granted,
    when, and under which version. This makes consent auditable and revocable."""
    granted = 1 if payload.get('granted', True) else 0
    scope = payload.get('scope', 'on-device facial-expression check-in + human review')
    session_label = payload.get('session_label', 'anonymous-session')

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO consents (consent_version, scope, granted, session_label) VALUES (?, ?, ?, ?)',
        (CONSENT_VERSION, scope, granted, session_label)
    )
    conn.commit()
    consent_id = cursor.lastrowid
    record_audit(conn, 'subject', 'consent_granted' if granted else 'consent_withdrawn',
                 None, f'consent_id={consent_id}; scope={scope}')
    cursor.execute('SELECT * FROM consents WHERE id = ?', (consent_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row


@router.get('/')
def list_consents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM consents ORDER BY id DESC LIMIT 100')
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {'version': CONSENT_VERSION, 'records': rows}
