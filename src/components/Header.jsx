import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, LogOut, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';

export function Header({ title, showBack = false }) {
  const { user, signOut, isDemo, switchDemoUser } = useAuth();
  const { isPartnerOnline } = usePresence();
  const location = useLocation();

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {showBack ? (
          <Link to="/home" className="btn-icon" aria-label="Back to home">
            <ArrowLeft size={20} />
          </Link>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25)'
          }}>
            <Heart size={22} fill="white" />
          </div>
        )}

        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1.2 }}>
            {title || 'Our Space'}
          </h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>{user.avatar} {user.displayName}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className={`pulse-dot`} style={{ background: isPartnerOnline ? '#10b981' : '#cbd5e1' }} />
                {isPartnerOnline ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>Partner online</span>
                ) : (
                  <span>Partner away</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isDemo && (
          <button
            onClick={switchDemoUser}
            className="btn-icon"
            title="Switch demo user perspective (Test Vetri vs Sweetheart)"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', display: 'flex', gap: '0.25rem' }}
          >
            <Users size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Switch</span>
          </button>
        )}
        
        {user && (
          <button
            onClick={signOut}
            className="btn-icon"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
