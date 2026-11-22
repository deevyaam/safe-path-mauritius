import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api';

export default function AuthPage({ onAuth }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reviewer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isRegister
        ? await registerUser({ email, password, role })
        : await loginUser({ email, password });
      onAuth(user);
      navigate(user.role === 'admin' ? '/admin' : '/reviewer');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-card">
      <div className="hero">
        <div>
          <span className="eyebrow">Staff access</span>
          <h1 className="page-title">{isRegister ? 'Create a staff account' : 'Staff sign in'}</h1>
          <p className="page-copy">
            Reviewer and admin tools are for trained staff. The public check-in does not require an account.
          </p>
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@organisation.mu" required />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? 'At least 6 characters' : 'Your password'} required />
        </div>

        {isRegister && (
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="reviewer">Reviewer (counsellor / NGO / school staff)</option>
              <option value="admin">Administrator (oversight)</option>
            </select>
          </div>
        )}

        {error && <div className="alert-soft">{error}</div>}

        <button type="submit" disabled={busy} style={{ marginTop: '6px' }}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <p className="text-muted" style={{ marginTop: '16px', marginBottom: 0, fontSize: '0.9rem' }}>
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" className="link-button"
            onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>
            {isRegister ? 'Sign in' : 'Create a staff account'}
          </button>
        </p>
      </form>

      <div className="card note-box">
        Accounts are stored <strong>on this device</strong> with passwords hashed via the
        browser’s Web Crypto (PBKDF2) — never in plain text. Sign-ins and registrations are
        written to the on-device audit trail. No server required.
      </div>
    </div>
  );
}
