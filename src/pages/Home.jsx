import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, MessageCircleHeart, Sparkles, Image, Music, Heart, Flame } from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { getTodayDateString, getQuestionForDate } from '../data/questions';

export function Home() {
  const { user, partnerProfile, isDemo } = useAuth();
  const { isPartnerOnline, togglePartnerPresenceDemo } = usePresence();

  const todayStr = getTodayDateString();
  const todayQuestion = getQuestionForDate(todayStr);

  const partnerName = partnerProfile?.display_name || user?.partnerName || 'Sweetheart';
  const partnerAvatar = partnerProfile?.avatar_emoji || user?.partnerAvatar || '🐰';

  return (
    <div>
      <Header />

      {/* Hero / Partner Presence Card */}
      <div className="cozy-card" style={{
        background: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)',
        borderColor: 'var(--border-light)',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Soft background decor */}
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15, pointerEvents: 'none' }}>
          <Heart size={120} fill="#f43f5e" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{user?.avatar || '🐻'}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>&amp;</span>
              <span style={{ fontSize: '1.5rem' }}>{partnerAvatar}</span>
            </div>

            {/* Live Presence Indicator */}
            <div
              className={`badge ${isPartnerOnline ? 'badge-online' : 'badge-offline'}`}
              onClick={isDemo ? togglePartnerPresenceDemo : undefined}
              title={isDemo ? "Click to toggle presence state (Demo)" : undefined}
              style={{ cursor: isDemo ? 'pointer' : 'default' }}
            >
              <span className="pulse-dot" style={{ background: isPartnerOnline ? '#10b981' : '#94a3b8' }} />
              <span>{isPartnerOnline ? `${partnerName} is here!` : `${partnerName} is away`}</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Hey {user?.displayName}! 💕
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
            {isPartnerOnline
              ? `${partnerName} is online right now in Our Space. Hang out or challenge each other!`
              : `Welcome to your secret hideaway. Drop today's answer or leave a game move for ${partnerName}.`}
          </p>
        </div>
      </div>

      {/* Rooms Navigation Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Rooms &amp; Activities
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          
          {/* 1. Together Room — Daily Question */}
          <Link to="/together/daily-question" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="cozy-card cozy-card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 16px rgba(244, 63, 94, 0.25)'
              }}>
                <MessageCircleHeart size={28} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Together Room</h4>
                  <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.7rem' }}>
                    Daily
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Today: "{todayQuestion.question}"
                </p>
              </div>
            </div>
          </Link>

          {/* 2. Play Room — Tic-Tac-Toe */}
          <Link to="/play/tic-tac-toe" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="cozy-card cozy-card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)'
              }}>
                <Gamepad2 size={28} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Play Room</h4>
                  <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.7rem' }}>
                    Realtime Game
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Tic-Tac-Toe • Live multiplayer board
                </p>
              </div>
            </div>
          </Link>

          {/* 3. Memory Room — Disabled / Coming Soon */}
          <div className="cozy-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', opacity: 0.65, background: '#fafafa' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '1.25rem',
              background: '#e2e8f0',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Image size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Memory Room</h4>
                <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem' }}>
                  Coming soon
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Shared photo scrapbook &amp; date diary
              </p>
            </div>
          </div>

          {/* 4. Vibe Room — Disabled / Coming Soon */}
          <div className="cozy-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', opacity: 0.65, background: '#fafafa' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '1.25rem',
              background: '#e2e8f0',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Music size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Vibe Room</h4>
                <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem' }}>
                  Coming soon
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Collaborative songs, moods &amp; playlists
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Romantic Footer Note */}
      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>Built with ❤️ just for the two of us.</p>
      </div>
    </div>
  );
}
