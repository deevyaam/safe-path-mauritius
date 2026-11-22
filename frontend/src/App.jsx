import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import NavBar from './components/NavBar';
import LandingPage from './components/LandingPage';
import ConsentPage from './components/ConsentPage';
import AnalysisPage from './components/AnalysisPage';
import ResultsPage from './components/ResultsPage';
import ReviewerDashboard from './components/ReviewerDashboard';
import ReferralPage from './components/ReferralPage';
import AdminDashboard from './components/AdminDashboard';
import EthicsPage from './components/EthicsPage';
import AuthPage from './components/AuthPage';

function loadUser() {
  try { return JSON.parse(localStorage.getItem('spm_user')) || null; } catch { return null; }
}

function App() {
  const [user, setUser] = useState(loadUser);
  const [consentGiven, setConsentGiven] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Role is derived from the signed-in account; visitors (no account) get the public flow.
  const userRole = user?.role || 'visitor';

  const handleAuth = (u) => {
    setUser(u);
    try { localStorage.setItem('spm_user', JSON.stringify(u)); } catch { /* ignore */ }
  };
  const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem('spm_user'); } catch { /* ignore */ }
  };

  return (
    <div className="app-shell">
      <NavBar userRole={userRole} user={user} onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/consent"
            element={<ConsentPage consentGiven={consentGiven} onConsent={setConsentGiven} />}
          />
          <Route
            path="/analysis"
            element={<AnalysisPage consentGiven={consentGiven} onResult={setAnalysisResult} />}
          />
          <Route path="/results" element={<ResultsPage result={analysisResult} />} />
          <Route path="/login" element={<AuthPage onAuth={handleAuth} />} />
          <Route path="/reviewer" element={<ReviewerDashboard userRole={userRole} />} />
          <Route path="/referral" element={<ReferralPage userRole={userRole} />} />
          <Route path="/admin" element={<AdminDashboard userRole={userRole} />} />
          <Route path="/ethics" element={<EthicsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
