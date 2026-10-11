import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import Background from './components/Background';
import Header from './components/Header';
import VoteView from './components/VoteView';
import type { AuthUser } from './types';

type View = 'vote' | 'admin';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<View>('vote');

  useEffect(() => {
    if (!getToken()) {
      setBooting(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const onAuth = useCallback((u: AuthUser) => {
    setUser(u);
    setView('vote');
  }, []);

  const onLogout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    api.me().then(setUser).catch(() => undefined);
  }, []);

  return (
    <div className="relative min-h-screen">
      <Background />
      <Header user={user} view={view} onChangeView={setView} onLogout={onLogout} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6 sm:pt-10">
        <AnimatePresence mode="wait">
          {booting ? (
            <motion.div
              key="boot"
              className="flex h-[50vh] items-center justify-center text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Loading…
            </motion.div>
          ) : !user ? (
            <Section key="auth">
              <AuthView onAuth={onAuth} />
            </Section>
          ) : view === 'admin' && user.role === 'admin' ? (
            <Section key="admin">
              <AdminView />
            </Section>
          ) : (
            <Section key="vote">
              <VoteView user={user} onVoted={refreshUser} />
            </Section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
