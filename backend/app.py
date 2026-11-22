from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, get_connection
from .routers import cases, admin, auth, analysis, consent, audit

app = FastAPI(title='Safe Path Mauritius API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(cases)
app.include_router(admin)
app.include_router(auth)
app.include_router(analysis)
app.include_router(consent)
app.include_router(audit)

@app.on_event('startup')
def startup():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(1) AS total FROM cases')
    total = cursor.fetchone()['total']
    if total == 0:
        from .seed_data import seed_database
        seed_database(conn)
    conn.close()

@app.get('/')
def root():
    return {'status': 'healthy', 'purpose': 'Safe Path Mauritius backend API'}
