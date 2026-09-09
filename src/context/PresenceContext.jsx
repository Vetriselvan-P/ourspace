import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const PresenceContext = createContext({});

export function PresenceProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsPartnerOnline(false);
      return;
    }

    // 1. Live Supabase Realtime Presence
    if (isConfigured && supabase && !isDemo) {
      const channel = supabase.channel('our-space-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      const checkPresence = () => {
        const state = channel.presenceState();
        const activeIds = Object.keys(state);
        const partnerActive = activeIds.some(id => id !== user.id);
        setIsPartnerOnline(partnerActive);
        if (!partnerActive && !lastSeen) {
          setLastSeen(new Date());
        }
      };

      channel
        .on('presence', { event: 'sync' }, checkPresence)
        .on('presence', { event: 'join' }, ({ key }) => {
          if (key !== user.id) {
            setIsPartnerOnline(true);
            setLastSeen(null);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (key !== user.id) {
            checkPresence();
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

      return () => {
        channel.untrack();
        supabase.removeChannel(channel);
      };
    }

    // 2. Demo Mode Presence (supports cross-tab syncing via standard BroadcastChannel API)
    if (isDemo && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('ourspace_demo_presence');
      
      // Announce self
      bc.postMessage({ type: 'heartbeat', userId: user.id, time: Date.now() });

      const handleMsg = (e) => {
        const { type, userId } = e.data || {};
        if (type === 'heartbeat' && userId !== user.id) {
          setIsPartnerOnline(true);
          // Respond so the other tab knows we are here too
          bc.postMessage({ type: 'ack', userId: user.id, time: Date.now() });
        }
        if (type === 'ack' && userId !== user.id) {
          setIsPartnerOnline(true);
        }
        if (type === 'leave' && userId !== user.id) {
          setIsPartnerOnline(false);
          setLastSeen(new Date());
        }
      };

      bc.addEventListener('message', handleMsg);

      // Heartbeat every 5 seconds
      const interval = setInterval(() => {
        bc.postMessage({ type: 'heartbeat', userId: user.id, time: Date.now() });
      }, 5000);

      // For standalone demo preview in 1 tab, default to online so user sees the lively badge
      setIsPartnerOnline(true);

      return () => {
        clearInterval(interval);
        bc.postMessage({ type: 'leave', userId: user.id });
        bc.removeEventListener('message', handleMsg);
        bc.close();
      };
    }

    // Fallback: indicate active
    setIsPartnerOnline(true);
  }, [user, isDemo]);

  // Ability to manually toggle partner presence in demo mode for testing UI
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
