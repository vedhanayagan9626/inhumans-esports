import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Mail, User as UserIcon, CheckCircle2, AlertTriangle, KeyRound, Sparkles, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types';
import inhumanIcon from '../../assets/inhuman-icon.png';

export const LoginPage: React.FC = () => {
  const { login, registerUser, cachedCredentials } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('player');

  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-fill cached credentials if available
  useEffect(() => {
    if (cachedCredentials && cachedCredentials.email) {
      setEmail(cachedCredentials.email);
      if (cachedCredentials.password) {
        setPassword(cachedCredentials.password);
      }
    }
  }, [cachedCredentials]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(email, password, remember);
      setLoading(false);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.message });
      }
    }, 200);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setFeedback({ type: 'error', message: 'Please fill out all required fields.' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        role: regRole,
        avatar: regRole === 'admin' ? '🛡️' : regRole === 'igl' ? '🎯' : regRole === 'coach' ? '👑' : '⚡',
        created_at: new Date().toISOString()
      });
      setLoading(false);

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setRegName('');
        setRegEmail('');
        setRegPassword('');
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }, 250);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 15%, rgba(229, 37, 53, 0.12) 0%, #0c0d11 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      color: '#ffffff',
      position: 'relative'
    }}>
      {/* Background Ambience Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        width: '400px',
        height: '400px',
        background: 'rgba(229, 37, 53, 0.08)',
        filter: 'blur(120px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Main Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#15161c',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        padding: '32px 28px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 14px auto',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1c1d25 0%, #121318 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(229, 37, 53, 0.4)'
          }}>
            <img
              src={inhumanIcon}
              alt="INHUMANS"
              style={{ width: '40px', height: 'auto', objectFit: 'contain' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              fontWeight: 900,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              INHUMANS
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--accent-red)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              ESPORTS
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#8a8d9a', marginTop: '6px' }}>
            BGMI Tactical Command & Competitive Analytics Portal
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Request Access */}
        <div style={{
          display: 'flex',
          background: '#0c0d11',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setFeedback(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              background: mode === 'login' ? 'var(--accent-red)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : '#8a8d9a',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setFeedback(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              background: mode === 'register' ? 'var(--accent-red)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : '#8a8d9a',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Request Access
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '0.82rem',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: feedback.type === 'error' ? 'rgba(229, 37, 53, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: feedback.type === 'error' ? '1px solid rgba(229, 37, 53, 0.35)' : '1px solid rgba(34, 197, 94, 0.35)',
            color: feedback.type === 'error' ? '#ff4d5e' : '#4ade80'
          }}>
            {feedback.type === 'error' ? (
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>{feedback.message}</div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* MODE: SIGN IN                                     */}
        {/* -------------------------------------------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={15} color="#71717a" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@inhumans.gg"
                  required
                  autoComplete="username"
                  className="input-control"
                  style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa' }}>
                  PASSWORD
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={15} color="#71717a" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-control"
                  style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Session Security Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#8a8d9a',
              marginTop: '-4px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--accent-red)' }}
                />
                <span>Remember on this device (1 hour active session)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.88rem',
                fontWeight: 800,
                borderRadius: '8px',
                marginTop: '6px'
              }}
              id="btn-login-submit"
            >
              {loading ? 'Authenticating...' : 'Sign In to INHUMANS'}
            </button>
          </form>
        )}

        {/* -------------------------------------------------- */}
        {/* MODE: REQUEST ACCESS / REGISTER                   */}
        {/* -------------------------------------------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                FULL NAME / USERNAME
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <UserIcon size={15} color="#71717a" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Vikram (VIPER)"
                  required
                  className="input-control"
                  style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={15} color="#71717a" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="player@inhumans.gg"
                  required
                  className="input-control"
                  style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                CREATE PASSWORD
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={15} color="#71717a" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-control"
                  style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                DESIRED ESPORTS ROLE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { role: 'player' as UserRole, label: 'Player', desc: 'Approved by Admin/IGL' },
                  { role: 'igl' as UserRole, label: 'IGL', desc: 'Requires Shaam approval' },
                  { role: 'coach' as UserRole, label: 'Coach', desc: 'Requires Shaam approval' },
                  { role: 'admin' as UserRole, label: 'Admin', desc: 'Requires Shaam approval' }
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setRegRole(item.role)}
                    style={{
                      background: regRole === item.role ? 'rgba(229, 37, 53, 0.15)' : '#1c1d25',
                      border: regRole === item.role ? '1px solid var(--accent-red)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: regRole === item.role ? '#ff4d5e' : '#ffffff' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#71717a' }}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Approval Hierarchy Callout */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.72rem',
              color: '#8a8d9a',
              lineHeight: 1.4
            }}>
              <strong style={{ color: '#ffffff' }}>Approval Hierarchy:</strong>
              <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                <li><strong>Admin, IGL & Coach:</strong> Accepted exclusively by Master Admin (Shaam).</li>
                <li><strong>Player:</strong> Accepted by Admins or IGLs.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.88rem',
                fontWeight: 800,
                borderRadius: '8px',
                marginTop: '4px'
              }}
              id="btn-register-submit"
            >
              {loading ? 'Submitting...' : 'Submit Request for Approval'}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '20px', fontSize: '0.72rem', color: '#52525b', textAlign: 'center' }}>
        INHUMANS Esports Tactical Command System • Protected by 1-Hour Session Cache
      </div>
    </div>
  );
};
