import { motion } from 'framer-motion';
import type { OptionResult } from '../types';

interface Props {
  results: OptionResult[];
  total: number;
  highlightOptionId?: string | null;
}

const FALLBACK = '#a78bfa';

export default function ResultsBars({ results, total, highlightOptionId }: Props) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => {
        const colour = r.colour ?? FALLBACK;
        const leading = i === 0 && r.votes > 0;
        return (
          <motion.div
            key={r.optionId}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative overflow-hidden rounded-2xl border p-4 ${
              highlightOptionId === r.optionId
                ? 'border-white/40'
                : 'border-white/10'
            }`}
          >
            {/* animated fill */}
            <motion.div
              className="absolute inset-y-0 left-0 -z-0"
              style={{ background: `linear-gradient(90deg, ${colour}44, ${colour}18)` }}
              initial={{ width: 0 }}
              animate={{ width: `${r.percentage}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: colour }} />
                <span className="font-sans font-medium">{r.label}</span>
                {leading && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                    leading
                  </span>
                )}
                {highlightOptionId === r.optionId && (
                  <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[11px] text-violet-200">
                    your vote
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold tabular-nums">
                  {r.percentage}%
                </div>
                <div className="text-xs text-white/45 tabular-nums">
                  {r.votes} {r.votes === 1 ? 'vote' : 'votes'}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      <p className="pt-1 text-center text-sm text-white/40 tabular-nums">
        {total} total {total === 1 ? 'vote' : 'votes'}
      </p>
    </div>
  );
}
