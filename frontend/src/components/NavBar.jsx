import { NavLink, Link, useNavigate } from 'react-router-dom';

/* ---- inline icons (stroke = currentColor) ---- */
const Icon = {
  home: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h5v-5.5h4V20h5V9.5" />
    </svg>
  ),
  consent: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3 5 6v5.5c0 4 3 7 7 8.5 4-1.5 7-4.5 7-8.5V6l-7-3Z" /><path d="m9 11.5 2 2 4-4" />
    </svg>
  ),
  analysis: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  results: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 19V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" /><path d="M13 3v6h6" /><path d="M9 14h6M9 17h4" />
    </svg>
  ),
  reviewer: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  ),
  referral: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 20s-6-4.2-6-8.5A3.5 3.5 0 0 1 12 9a3.5 3.5 0 0 1 6 2.5C18 15.8 12 20 12 20Z" />
    </svg>
  ),
  admin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="18" r="2" />
    </svg>
  ),
  chevron: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  ),
  logout: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" /><path d="M10 17l-5-5 5-5" /><path d="M5 12h12" />
    </svg>
  )
};

const ALL = {
  home: { label: 'Home', path: '/', icon: 'home' },
  consent: { label: 'Consent', path: '/consent', icon: 'consent' },
  analysis: { label: 'Check-in', path: '/analysis', icon: 'analysis' },
  results: { label: 'Results', path: '/results', icon: 'results' },
  reviewer: { label: 'Cases', path: '/reviewer', icon: 'reviewer' },
  referral: { label: 'Referral', path: '/referral', icon: 'referral' },
  admin: { label: 'Admin', path: '/admin', icon: 'admin' }
};

/* bottom-tab destinations adapt to the active role */
const TABS_BY_ROLE = {
  visitor: ['home', 'consent', 'analysis', 'results'],
  reviewer: ['home', 'analysis', 'results', 'reviewer', 'referral'],
  admin: ['home', 'results', 'reviewer', 'referral', 'admin']
};

export default function NavBar({ userRole, user, onLogout }) {
  const navigate = useNavigate();
  const tabs = (TABS_BY_ROLE[userRole] || TABS_BY_ROLE.visitor).map((k) => ALL[k]);

  const logout = () => { onLogout?.(); navigate('/'); };

  return (
    <>
      <header className="app-bar">
        <div className="app-bar-inner">
          <Link to="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5 5 5.4v5.3c0 4.3 3 7.6 7 9.3 4-1.7 7-5 7-9.3V5.4L12 2.5Z" />
                <path d="m8.5 12 2.4 2.4L15.8 9.5" />
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-name">Safe Path</span>
              <span className="brand-sub">Mauritius</span>
            </span>
          </Link>

          {user ? (
            <div className="account">
              <span className="account-meta">
                <span className="account-email" title={user.email}>{user.email}</span>
                <span className="account-role">{user.role}</span>
              </span>
              <button type="button" className="account-btn" onClick={logout} title="Sign out">
                <Icon.logout aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="role-chip" style={{ textDecoration: 'none' }}>
              <Icon.user aria-hidden="true" />
              Staff log in
            </Link>
          )}
        </div>
      </header>

      <nav className="bottom-nav" aria-label="Primary">
        <div className="bottom-nav-inner">
          {tabs.map((item) => {
            const IconCmp = Icon[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
              >
                <span className="tab-icon"><IconCmp aria-hidden="true" /></span>
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
