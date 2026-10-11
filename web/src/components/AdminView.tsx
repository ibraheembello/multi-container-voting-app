import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { AdminStats } from '../types';
import ResultsBars from './ResultsBars';

export default function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => api.adminStats().then(setStats).catch((e) => setError(e.message));
    load();
    const id = window.setInterval(load, 4000);
    return () => window.clearInterval(id);
  }, []);

  if (error) {
    return <p className="py-20 text-center text-pink-300">{error}</p>;
  }
  if (!stats) {
    return <div className="py-20 text-center text-white/40">Loading dashboard…</div>;
  }

  const tiles = [
    { label: 'Registered users', value: stats.totalUsers },
    { label: 'Votes cast', value: stats.totalVotes },
    { label: 'Turnout', value: `${stats.turnout}%` },
    { label: 'Queue depth', value: stats.queueDepth },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold">Admin dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-4"
          >
            <div className="font-display text-2xl font-semibold tabular-nums">{t.value}</div>
            <div className="mt-1 text-xs text-white/50">{t.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass mb-6 rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{stats.results.question}</h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/45">
            source: {stats.results.source}
          </span>
        </div>
        <ResultsBars results={stats.results.results} total={stats.results.total} />
      </div>

      <div className="glass rounded-3xl p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Recent votes</h2>
        {stats.recentVotes.length === 0 ? (
          <p className="text-sm text-white/40">No votes yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {stats.recentVotes.map((v, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-white/70">{v.voter}</span>
                <span className="font-medium">{v.option}</span>
                <span className="text-xs text-white/35 tabular-nums">
                  {new Date(v.at).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
