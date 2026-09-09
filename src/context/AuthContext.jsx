import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../lib/supabase';

const AuthContext = createContext({});

const DEMO_USERS = {
  userA: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'vetri@ourspace.local',
    displayName: 'Vetri',
    avatar: '🐻',
    partnerName: 'Sweetheart',
    partnerEmail: 'sweetheart@ourspace.local',
    partnerAvatar: '🐰',
  },
  userB: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'sweetheart@ourspace.local',
    displayName: 'Sweetheart',
    avatar: '🐰',
    partnerName: 'Vetri',
    partnerEmail: 'vetri@ourspace.local',
    partnerAvatar: '🐻',
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);

  // Initialize Auth state
  useEffect(() => {
    // Check localStorage for demo session first
    const savedDemoUserKey = localStorage.getItem('ourspace_demo_user');
    if (savedDemoUserKey && DEMO_USERS[savedDemoUserKey]) {
      const demoUser = DEMO_USERS[savedDemoUserKey];
      setUser(demoUser);
      setIsDemo(true);
      setPartnerProfile({
        display_name: demoUser.partnerName,
        avatar_emoji: demoUser.partnerAvatar,
        email: demoUser.partnerEmail
      });
      setLoading(false);
      return;
    }

    if (!isConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Live Supabase session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        handleUserSetup(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        handleUserSetup(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleUserSetup(authUser) {
    try {
      // Fetch user profile and partner profile from Supabase
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      let currentProfile = profiles?.find(p => p.id === authUser.id);
      let partner = profiles?.find(p => p.id !== authUser.id);

      // If user has no profile row yet, auto-create one
      if (!currentProfile && authUser) {
        const defaultName = authUser.email?.split('@')[0] || 'My Love';
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([
            { id: authUser.id, email: authUser.email, display_name: defaultName, avatar_emoji: '❤️' }
          ])
          .select()
          .single();
        currentProfile = newProfile;
      }

      setUser({
        id: authUser.id,
        email: authUser.email,
        displayName: currentProfile?.display_name || authUser.email?.split('@')[0] || 'My Love',
        avatar: currentProfile?.avatar_emoji || '❤️',
      });

      if (partner) {
        setPartnerProfile(partner);
      } else {
        setPartnerProfile({
          display_name: 'Partner',
          avatar_emoji: '✨',
          email: 'partner@ourspace.local'
        });
      }
    } catch (err) {
      console.warn('Error loading profiles:', err);
      setUser({
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.email?.split('@')[0] || 'Me',
        avatar: '❤️'
      });
      setPartnerProfile({
        display_name: 'Partner',
        avatar_emoji: '✨'
      });
    } finally {
      setLoading(false);
    }
  }

  // Real Supabase Login
  async function signIn(email, password) {
    if (!isConfigured || !supabase) {
      throw new Error('Supabase is not configured yet. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY or use Demo Mode.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  // Sign Out
  async function signOut() {
    if (isDemo) {
      localStorage.removeItem('ourspace_demo_user');
      setUser(null);
      setIsDemo(false);
      setPartnerProfile(null);
      return;
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }

  // Quick Demo Login (for previewing before Supabase keys are configured)
  function enterDemoMode(userKey = 'userA') {
    const demoUser = DEMO_USERS[userKey] || DEMO_USERS.userA;
    localStorage.setItem('ourspace_demo_user', userKey);
    setUser(demoUser);
    setIsDemo(true);
    setPartnerProfile({
      display_name: demoUser.partnerName,
      avatar_emoji: demoUser.partnerAvatar,
      email: demoUser.partnerEmail
    });
  }

  // Switch demo user between Vetri and Sweetheart
  function switchDemoUser() {
    if (!isDemo || !user) return;
    const currentKey = user.id === DEMO_USERS.userA.id ? 'userB' : 'userA';
    enterDemoMode(currentKey);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        isDemo,
        partnerProfile,
        signIn,
        signOut,
        enterDemoMode,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
