import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, Sparkles, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, enterDemoMode, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (userKey) => {
    enterDemoMode(userKey);
    navigate('/home');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '85vh',
      maxWidth: '400px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '2rem',
          background: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
          color: 'white',
          boxShadow: '0 12px 24px rgba(244, 63, 94, 0.25)',
          marginBottom: '1rem',
        }}>
          <Heart size={38} fill="white" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Our Space
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          A private corner in the universe, just for the two of us ✨
        </p>
      </div>

      {/* Login Card */}
      <div className="cozy-card">
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.875rem',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? 'Opening Our Space...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Mode / Local Preview Section */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            <span>{!isConfigured ? 'Supabase not connected yet? Try Demo Mode:' : 'Or test immediately via Demo Mode:'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('userA')}
              className="btn-secondary"
              style={{ padding: '0.6rem 0.5rem', fontSize: '0.85rem' }}
            >
              <span>🐻 Log in as Vetri</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('userB')}
              className="btn-secondary"
              style={{ padding: '0.6rem 0.5rem', fontSize: '0.85rem' }}
            >
              <span>🐰 Log in as Partner</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        Private Sanctuary • Invitation Only
      </div>
    </div>
  );
}
