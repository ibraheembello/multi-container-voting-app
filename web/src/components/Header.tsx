import { motion } from 'framer-motion';
import type { AuthUser } from '../types';

interface Props {
  user: AuthUser | null;
  view: 'vote' | 'admin';
  onChangeView: (v: 'vote' | 'admin') => void;
  onLogout: () => void;
}

export default function Header({ user, view, onChangeView, onLogout }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 font-display text-lg font-bold text-ink">
          C
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">CloudVote</span>
      </motion.div>

      {user && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          {user.role === 'admin' && (
            <div className="flex rounded-full border border-white/10 bg-black/30 p-1 text-sm">
              <TabButton active={view === 'vote'} onClick={() => onChangeView('vote')}>
                Vote
              </TabButton>
              <TabButton active={view === 'admin'} onClick={() => onChangeView('admin')}>
                Admin
              </TabButton>
            </div>
          )}
          <button
            onClick={onLogout}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </motion.div>
      )}
    </header>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full px-4 py-1.5 transition ${
        active ? 'text-ink' : 'text-white/60 hover:text-white'
      }`}
    >
      {active && (
        <motion.span
          layoutId="tab-pill"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-300 to-pink-300"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10 font-medium">{children}</span>
    </button>
  );
}
