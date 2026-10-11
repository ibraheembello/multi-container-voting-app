import { motion } from 'framer-motion';
import { FormEvent, useState } from 'react';
import { api, setToken } from '../api';
import type { AuthUser } from '../types';

export default function AuthView({ onAuth }: { onAuth: (u: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await (mode === 'login'
        ? api.login(email, password)
        : api.register(email, password));
      setToken(result.token);
      onAuth(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <motion.h1
          className="font-display text-4xl font-bold leading-tight sm:text-5xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Make your vote count.
        </motion.h1>
        <motion.p
          className="mt-3 text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          One account, one vote, results in real time.
        </motion.p>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex rounded-full border border-white/10 bg-black/30 p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`relative flex-1 rounded-full py-2 text-sm font-medium transition ${
                mode === m ? 'text-ink' : 'text-white/60 hover:text-white'
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-300 to-pink-300"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m === 'login' ? 'Sign in' : 'Create account'}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            className="field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="field"
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-pink-500/10 px-3 py-2 text-sm text-pink-300"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
