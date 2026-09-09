import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const PresenceContext = createContext({});

/**
 * Helper to check if the partner is present in the current presence state.
 * @param {Record<string, Array<any>>} state - channel.presenceState()
 * @param {string} myUserId - Current authenticated user ID
 * @param {string|null} partnerUserId - Partner's user ID if resolved
 */
function checkIsPartnerPresent(state, myUserId) {
  if (!state || typeof state !== 'object') return false;

  for (const [key, presences] of Object.entries(state)) {
    if (key !== myUserId && Array.isArray(presences) && presences.length > 0) {
      return true;
    }
  }
  return false;
}

export function PresenceProvider({ children }) {
  const { user, partnerProfile, isDemo } = useAuth();
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsPartnerOnline(false);
      return;
    }

    const partnerId = partnerProfile?.id || null;

    // 1. Live Supabase Realtime Presence
    if (isConfigured && supabase && !isDemo) {
      const channel = supabase.channel('our-space-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      const syncPresence = () => {
        const state = channel.presenceState();
        const online = checkIsPartnerPresent(state, user.id);
        setIsPartnerOnline(online);
        if (!online && !lastSeen) {
          setLastSeen(new Date());
        }
      };

      channel
        .on('presence', { event: 'sync' }, () => {
          syncPresence();
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (key !== user.id && Array.isArray(newPresences) && newPresences.length > 0) {
            setIsPartnerOnline(true);
            setLastSeen(null);
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const state = channel.presenceState();
          const leftRefs = new Set((leftPresences || []).map(p => p.presence_ref));

          let partnerStillOnline = false;
          for (const [k, presences] of Object.entries(state)) {
            if (k !== user.id && Array.isArray(presences)) {
              const remaining = presences.filter(p => !leftRefs.has(p.presence_ref));
              if (remaining.length > 0) {
                partnerStillOnline = true;
                break;
              }
            }
          }

          setIsPartnerOnline(partnerStillOnline);
          if (!partnerStillOnline) {
            setLastSeen(new Date());
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              displayName: user.displayName,
              online_at: new Date().toISOString(),
            });
          }
        });

      // Handle abrupt window/tab close so presence drops immediately
      const handleBeforeUnload = () => {
        try {
          channel.untrack();
        } catch (e) {}
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        try {
          channel.untrack();
          supabase.removeChannel(channel);
        } catch (e) {}
      };
    }

    // 2. Demo Mode Presence (via BroadcastChannel for multi-tab testing)
    if (isDemo && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('ourspace_demo_presence');

      // Heartbeat message to detect partner tab
      bc.postMessage({ type: 'heartbeat', userId: user.id, time: Date.now() });

      let partnerTimeout = null;

      const handleMsg = (e) => {
        const { type, userId } = e.data || {};
        if (userId !== user.id) {
          if (type === 'heartbeat' || type === 'ack') {
            setIsPartnerOnline(true);
            setLastSeen(null);
            if (type === 'heartbeat') {
              bc.postMessage({ type: 'ack', userId: user.id, time: Date.now() });
            }

            // If we don't receive heartbeat within 8 seconds, partner went away
            clearTimeout(partnerTimeout);
            partnerTimeout = setTimeout(() => {
              setIsPartnerOnline(false);
              setLastSeen(new Date());
            }, 8000);
          } else if (type === 'leave') {
            setIsPartnerOnline(false);
            setLastSeen(new Date());
            clearTimeout(partnerTimeout);
          }
        }
      };

      bc.addEventListener('message', handleMsg);

      const interval = setInterval(() => {
        bc.postMessage({ type: 'heartbeat', userId: user.id, time: Date.now() });
      }, 4000);

      const handleUnload = () => {
        bc.postMessage({ type: 'leave', userId: user.id });
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        clearInterval(interval);
        clearTimeout(partnerTimeout);
        window.removeEventListener('beforeunload', handleUnload);
        bc.postMessage({ type: 'leave', userId: user.id });
        bc.removeEventListener('message', handleMsg);
        bc.close();
      };
    }

    // Default when no presence is detected
    setIsPartnerOnline(false);
  }, [user, partnerProfile, isDemo]);

  const togglePartnerPresenceDemo = () => {
    setIsPartnerOnline(prev => !prev);
    if (isPartnerOnline) setLastSeen(new Date());
  };

  return (
    <PresenceContext.Provider value={{ isPartnerOnline, lastSeen, togglePartnerPresenceDemo }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
