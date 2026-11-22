from fastapi import APIRouter
from ..database import get_connection

router = APIRouter(prefix='/admin', tags=['admin'])

@router.get('/organizations')
def list_organizations():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM organizations ORDER BY name')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post('/organizations')
def create_organization(data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO organizations (name, description, contact) VALUES (?, ?, ?)',
        (data.get('name', 'Unknown'), data.get('description', ''), data.get('contact', ''))
    )
    conn.commit()
    org_id = cursor.lastrowid
    conn.close()
    return {'id': org_id, 'name': data.get('name', ''), 'description': data.get('description', ''), 'contact': data.get('contact', '')}
