from fastapi import APIRouter
from ..database import get_connection

router = APIRouter(prefix='/audit', tags=['audit'])


@router.get('/')
def list_audit(limit: int = 50):
    """Return the most recent audit-trail entries (human-review actions,
    consent events). Demonstrates that every action is recorded and reviewable."""
    limit = max(1, min(limit, 200))
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?', (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows
