import { motion } from 'framer-motion';

const COLOURS = ['#a78bfa', '#f0abfc', '#818cf8', '#2dd4bf', '#fbbf24'];
const PIECES = Array.from({ length: 28 }, (_, i) => i);

// A short, self-contained confetti burst from the centre. Mounts on vote.
export default function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {PIECES.map((i) => {
        const angle = (i / PIECES.length) * Math.PI * 2;
        const distance = 120 + Math.random() * 180;
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-sm"
            style={{ background: COLOURS[i % COLOURS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + 60,
              opacity: 0,
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
