import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { AuthUser, Poll, ResultsPayload } from '../types';
import Confetti from './Confetti';
import ResultsBars from './ResultsBars';

const MY_OPTION_KEY = 'cv_my_option';

export default function VoteView({
  user,
  onVoted,
}: {
  user: AuthUser;
  onVoted: () => void;
}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [voted, setVoted] = useState(user.hasVoted);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [myOption, setMyOption] = useState<string | null>(
    () => localStorage.getItem(MY_OPTION_KEY),
  );
  const timer = useRef<number>();

  const loadResults = useCallback(() => {
    api.getResults().then(setResults).catch(() => undefined);
  }, []);

  useEffect(() => {
    api.getPoll().then(setPoll).catch((e) => setError(e.message));
    loadResults();
    timer.current = window.setInterval(loadResults, 3000);
    return () => window.clearInterval(timer.current);
  }, [loadResults]);

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.castVote(selected);
      localStorage.setItem(MY_OPTION_KEY, selected);
      setMyOption(selected);
      setVoted(true);
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 1300);
      onVoted();
      loadResults();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record your vote');
      // If the server says already-voted, flip to results so the UI stays honest.
      setVoted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!poll) {
    return <div className="py-20 text-center text-white/40">Loading poll…</div>;
  }

  return (
    <div className="mx-auto max-w-xl">
      {confetti && <Confetti />}

      <div className="mb-6 text-center">
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-widest text-white/50">
          Live poll
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
          {poll.question}
        </h1>
      </div>

      <div className="glass rounded-3xl p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {!voted ? (
            <motion.div
              key="ballot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <div className="grid gap-3">
                {poll.options.map((o, i) => {
                  const active = selected === o.id;
                  const colour = o.colour ?? '#a78bfa';
                  return (
                    <motion.button
                      key={o.id}
                      onClick={() => setSelected(o.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-white/50 bg-white/5'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ background: colour }}
                        />
                        <span className="font-medium">{o.label}</span>
                      </span>
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                          active ? 'border-white bg-white' : 'border-white/30'
                        }`}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-ink" />}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {error && <p className="mt-4 text-sm text-pink-300">{error}</p>}

              <button
                className="btn-primary mt-6 w-full"
                disabled={!selected || submitting}
                onClick={submit}
              >
                {submitting ? 'Recording…' : 'Submit vote'}
              </button>
              <p className="mt-3 text-center text-xs text-white/40">
                You can vote once. Results update live for everyone.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Thanks for voting — live results
              </div>
              {results ? (
                <ResultsBars
                  results={results.results}
                  total={results.total}
                  highlightOptionId={myOption}
                />
              ) : (
                <p className="py-8 text-center text-white/40">Tallying…</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
