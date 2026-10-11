import { motion } from 'framer-motion';

// Animated gradient-mesh background: three slow-drifting colour blobs over a
// deep base, plus a grain layer. Pure CSS/transform, cheap to run.
const BLOBS = [
  { c: '#7c3aed', x: '8%', y: '12%', s: 460 },
  { c: '#ec4899', x: '72%', y: '8%', s: 400 },
  { c: '#2dd4bf', x: '55%', y: '78%', s: 520 },
];

export default function Background() {
  return (
    <>
      <div className="bg-mesh">
        {BLOBS.map((b, i) => (
          <motion.div
            key={i}
            className="bg-blob"
            style={{ left: b.x, top: b.y, width: b.s, height: b.s, background: b.c }}
            animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.12, 0.96, 1] }}
            transition={{ duration: 20 + i * 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <div className="bg-grain" />
    </>
  );
}
