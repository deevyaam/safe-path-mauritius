import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'safe_path.db')

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            concern_level TEXT NOT NULL,
            status TEXT NOT NULL,
            summary TEXT NOT NULL,
            indicators TEXT NOT NULL,
            reviewer_notes TEXT,
            referral TEXT
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            contact TEXT
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS consents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            consent_version TEXT NOT NULL,
            scope TEXT NOT NULL,
            granted INTEGER NOT NULL,
            session_label TEXT
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            actor_role TEXT NOT NULL,
            action TEXT NOT NULL,
            case_id TEXT,
            details TEXT
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL,
            token TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        '''
    )
    conn.commit()
    conn.close()


def record_audit(conn, actor_role, action, case_id=None, details=''):
    """Append an entry to the audit trail. Every human-review action flows
    through here so oversight is documented and reviewable."""
    conn.execute(
        'INSERT INTO audit_log (actor_role, action, case_id, details) VALUES (?, ?, ?, ?)',
        (actor_role, action, case_id, details)
    )
    conn.commit()
