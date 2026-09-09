import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { MessageCircleHeart, Send, Lock, Unlock, Sparkles, Calendar, CheckCircle2, ChevronRight, Heart } from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { supabase, isConfigured } from '../lib/supabase';
import { getTodayDateString, getQuestionForDate, DAILY_QUESTIONS } from '../data/questions';

export function DailyQuestion() {
  const { user, partnerProfile, isDemo } = useAuth();
  const [todayStr, setTodayStr] = useState(getTodayDateString());
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [myAnswer, setMyAnswer] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const [mySubmittedAnswer, setMySubmittedAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);

  const questionObj = getQuestionForDate(selectedDate);
  const isToday = selectedDate === todayStr;

  const partnerName = partnerProfile?.display_name || user?.partnerName || 'Partner';
  const partnerAvatar = partnerProfile?.avatar_emoji || user?.partnerAvatar || '🐰';

  // Both have answered condition
  const bothAnswered = Boolean(mySubmittedAnswer && partnerAnswer);

  // Trigger celebration when both unlocked
  const triggerUnlockConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fb7185', '#fda4af']
      });
    } catch (e) {}
  }, []);

  // Fetch answers for selected date
  const loadAnswers = useCallback(async (dateToLoad) => {
    setLoading(true);

    if (isConfigured && supabase && !isDemo) {
      try {
        const { data, error } = await supabase
          .from('daily_answers')
          .select('*')
          .eq('date', dateToLoad);

        if (!error && data) {
          const myEntry = data.find(d => d.user_id === user.id);
          const partnerEntry = data.find(d => d.user_id !== user.id);

          setMySubmittedAnswer(myEntry ? myEntry.answer_text : null);
          setPartnerAnswer(partnerEntry ? partnerEntry.answer_text : null);

          if (myEntry && partnerEntry) {
            triggerUnlockConfetti();
          }
        }
      } catch (err) {
        console.error('Error fetching daily answers:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Demo Mode: LocalStorage + BroadcastChannel simulation
    if (isDemo) {
      try {
        const demoStorageKey = `ourspace_daily_answers_${dateToLoad}`;
        const stored = localStorage.getItem(demoStorageKey);
        const parsed = stored ? JSON.parse(stored) : {};

        const myEntry = parsed[user.id];
        // Partner is whichever key is not current user
        const partnerKey = Object.keys(parsed).find(k => k !== user.id);
        const partnerEntry = partnerKey ? parsed[partnerKey] : null;

        setMySubmittedAnswer(myEntry ? myEntry.answer_text : null);
        setPartnerAnswer(partnerEntry ? partnerEntry.answer_text : null);

        if (myEntry && partnerEntry) {
          triggerUnlockConfetti();
        }
      } catch (e) {}
      setLoading(false);
    }
  }, [user, isDemo, triggerUnlockConfetti]);

  useEffect(() => {
    loadAnswers(selectedDate);

    // 1. Supabase Realtime Subscription
    if (isConfigured && supabase && !isDemo) {
      const channel = supabase
        .channel(`public:daily_answers:${selectedDate}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'daily_answers', filter: `date=eq.${selectedDate}` },
          () => {
            loadAnswers(selectedDate);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // 2. Demo Mode Sync
    if (isDemo) {
      const bc = new BroadcastChannel('ourspace_daily_question_channel');
      bc.onmessage = (event) => {
        if (event.data?.date === selectedDate) {
          loadAnswers(selectedDate);
        }
      };
      return () => {
        bc.close();
      };
    }
  }, [selectedDate, isDemo, loadAnswers]);

  // Submit Answer
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    setSubmitting(true);
    const answerText = myAnswer.trim();

    if (isConfigured && supabase && !isDemo) {
      try {
        const { error } = await supabase
          .from('daily_answers')
          .upsert({
            date: selectedDate,
            user_id: user.id,
            question_id: questionObj.id,
            answer_text: answerText,
            updated_at: new Date().toISOString()
          }, { onConflict: 'date, user_id' });

        if (!error) {
          setMySubmittedAnswer(answerText);
          setMyAnswer('');
          loadAnswers(selectedDate);
        } else {
          alert(`Failed to save answer: ${error.message}`);
        }
      } catch (err) {
        alert(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Demo Mode Submission
    if (isDemo) {
      const demoStorageKey = `ourspace_daily_answers_${selectedDate}`;
      const stored = localStorage.getItem(demoStorageKey);
      const parsed = stored ? JSON.parse(stored) : {};

      parsed[user.id] = {
        answer_text: answerText,
        submitted_at: new Date().toISOString()
      };

      localStorage.setItem(demoStorageKey, JSON.stringify(parsed));
      setMySubmittedAnswer(answerText);
      setMyAnswer('');

      // Broadcast to other tab
      const bc = new BroadcastChannel('ourspace_daily_question_channel');
      bc.postMessage({ type: 'NEW_ANSWER', date: selectedDate });
      bc.close();

      setSubmitting(false);
      loadAnswers(selectedDate);
    }
  };

  return (
    <div>
      <Header title="Together Room" showBack />

      {/* Date & Mode Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Calendar size={16} />
          <span>{selectedDate === todayStr ? `Today • ${selectedDate}` : selectedDate}</span>
        </div>

        <button
          onClick={() => setShowArchive(!showArchive)}
          className="btn-icon"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', display: 'flex', gap: '0.3rem' }}
        >
          <Sparkles size={14} color="var(--primary)" />
          <span>{showArchive ? 'Close Past Days' : 'Past Questions'}</span>
        </button>
      </div>

      {/* Past Days Archive Drawer */}
      {showArchive && (
        <div className="cozy-card" style={{ marginBottom: '1.5rem', background: '#faf5ff', borderColor: '#e9d5ff' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6b21a8', marginBottom: '0.75rem' }}>
            Choose a day to revisit:
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {[-3, -2, -1, 0].map(offset => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const dateStr = d.toISOString().split('T')[0];
              const isCurr = dateStr === selectedDate;
              return (
                <button
                  key={offset}
                  onClick={() => { setSelectedDate(dateStr); setShowArchive(false); }}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '0.75rem',
                    border: isCurr ? '2px solid var(--primary)' : '1px solid #d8b4fe',
                    background: isCurr ? 'white' : '#f3e8ff',
                    fontWeight: isCurr ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {offset === 0 ? 'Today' : `${Math.abs(offset)}d ago`} ({dateStr.slice(5)})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Question Card */}
      <div className="cozy-card" style={{
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
        borderColor: 'var(--border-light)',
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          <MessageCircleHeart size={18} />
          <span>Daily Question #{questionObj.id}</span>
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '0.75rem' }}>
          "{questionObj.question}"
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>🔒 Answers stay hidden until both of you reply!</span>
        </div>
      </div>

      {/* Status & Answer Reveal Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading answers...
        </div>
      ) : bothAnswered ? (
        /* BOTH HAVE ANSWERED: REVEAL CARDS! */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '1.5px solid #86efac',
            borderRadius: '1rem',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#166534',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
            <Unlock size={20} color="#15803d" />
            <span>Both answered! Answers revealed for both of you ✨</span>
          </div>

          {/* Current User Answer Card */}
          <div className="cozy-card" style={{ borderLeft: '5px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{user?.avatar || '🐻'}</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user?.displayName || 'You'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Answered</span>
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{mySubmittedAnswer}"
            </p>
          </div>

          {/* Partner Answer Card */}
          <div className="cozy-card" style={{ borderLeft: '5px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{partnerAvatar}</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{partnerName}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Answered</span>
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{partnerAnswer}"
            </p>
          </div>
        </div>
      ) : mySubmittedAnswer ? (
        /* CURRENT USER ANSWERED, WAITING FOR PARTNER */
        <div className="cozy-card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Lock size={28} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Your answer is locked in! 🔒
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
            Waiting for {partnerName} to submit their response. As soon as they reply, both answers will instantly unlock together!
          </p>

          <div style={{
            background: '#fafafa',
            border: '1px solid #f1f5f9',
            borderRadius: '1rem',
            padding: '1rem',
            textAlign: 'left',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Your Response:
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
              "{mySubmittedAnswer}"
            </p>
          </div>

          {isDemo && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              💡 Tip: Click "Switch" in the top header to answer as {partnerName} and watch them unlock!
            </div>
          )}
        </div>
      ) : (
        /* CURRENT USER HAS NOT ANSWERED YET: INPUT FORM */
        <div className="cozy-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Write Your Answer
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              id="input-daily-answer"
              rows={4}
              required
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Speak from your heart... What comes to mind?"
              className="input-field"
              style={{ resize: 'none', lineHeight: 1.5 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Single submission per day</span>
              <span>{myAnswer.length} chars</span>
            </div>

            <button
              id="btn-submit-answer"
              type="submit"
              disabled={submitting || !myAnswer.trim()}
              className="btn-primary"
            >
              <Send size={18} />
              <span>{submitting ? 'Locking in...' : 'Lock In My Answer'}</span>
            </button>
          </form>
        </div>
      )}

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        💌 Private &amp; encrypted between you two
      </div>
    </div>
  );
}
