import hashlib
import secrets

from fastapi import APIRouter, HTTPException
from ..database import get_connection, record_audit

router = APIRouter(prefix='/auth', tags=['auth'])

VALID_ROLES = {'reviewer', 'admin'}


def _hash_pw(password: str, salt: str) -> str:
    """PBKDF2-HMAC-SHA256 via the standard library — no external deps,
    and passwords are never stored in plain text."""
    return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 100_000).hex()


@router.post('/register')
def register(payload: dict):
    email = (payload.get('email') or '').strip().lower()
    password = payload.get('password') or ''
    role = payload.get('role', 'reviewer')

    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail='A valid email is required.')
    if len(password) < 6:
        raise HTTPException(status_code=400, detail='Password must be at least 6 characters.')
    if role not in VALID_ROLES:
        role = 'reviewer'

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT 1 FROM users WHERE email = ?', (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail='An account with this email already exists.')

    salt = secrets.token_hex(16)
    token = secrets.token_hex(24)
    cursor.execute(
        'INSERT INTO users (email, password_hash, salt, role, token) VALUES (?, ?, ?, ?, ?)',
        (email, _hash_pw(password, salt), salt, role, token)
    )
    conn.commit()
    user_id = cursor.lastrowid
    record_audit(conn, role, 'user_registered', None, f'email={email}')
    conn.close()
    return {'id': user_id, 'email': email, 'role': role, 'token': token}


@router.post('/login')
def login(payload: dict):
    email = (payload.get('email') or '').strip().lower()
    password = payload.get('password') or ''

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    if row is None or _hash_pw(password, row['salt']) != row['password_hash']:
        conn.close()
        raise HTTPException(status_code=401, detail='Invalid email or password.')

    token = secrets.token_hex(24)  # rotate a simple session token on each login
    cursor.execute('UPDATE users SET token = ? WHERE id = ?', (token, row['id']))
    conn.commit()
    record_audit(conn, row['role'], 'user_login', None, f'email={email}')
    conn.close()
    return {'id': row['id'], 'email': row['email'], 'role': row['role'], 'token': token}
