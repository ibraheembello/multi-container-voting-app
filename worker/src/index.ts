import { createServer } from 'http';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { loadConfig } from './config';
import { parseQueuedVote, VOTE_QUEUE } from './keys';
import { processVote } from './processor';

const config = loadConfig();
const log = (msg: string, extra?: unknown) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), svc: 'worker', msg, extra }));

const pool = new Pool({ connectionString: config.databaseUrl, max: 4 });
// Separate connections: one blocks on BRPOP, one runs cache writes / LLEN.
const blocking = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
const cache = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

let running = true;
let processed = 0;
let duplicates = 0;
let lastProcessedAt: string | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Block until the API (via TypeORM) has created the votes table. */
async function waitForSchema(): Promise<void> {
  for (let attempt = 1; running; attempt++) {
    try {
      const { rows } = await pool.query("SELECT to_regclass('public.votes') AS t");
      if (rows[0]?.t) {
        log('votes table is ready');
        return;
      }
    } catch (err) {
      log('waiting for database', (err as Error).message);
    }
    if (attempt % 5 === 0) log(`still waiting for schema (attempt ${attempt})`);
    await sleep(3000);
  }
}

async function consumeLoop(): Promise<void> {
  log('consumer started');
  while (running) {
    let raw: string | undefined;
    try {
      const popped = await blocking.brpop(VOTE_QUEUE, 5);
      if (!popped) continue; // timeout, loop again so shutdown is responsive
      raw = popped[1];
      const vote = parseQueuedVote(raw);
      if (!vote) {
        log('dropping unparseable queue entry', raw);
        continue;
      }
      const outcome = await processVote(pool, cache, vote);
      if (outcome === 'persisted') {
        processed++;
        lastProcessedAt = new Date().toISOString();
      } else {
        duplicates++;
      }
    } catch (err) {
      log('failed to process vote, requeueing', (err as Error).message);
      if (raw) await cache.lpush(VOTE_QUEUE, raw); // at-least-once: put it back
      await sleep(1000);
    }
  }
  log('consumer stopped');
}

function startHealthServer(): ReturnType<typeof createServer> {
  const server = createServer(async (req, res) => {
    if (req.url !== '/health') {
      res.writeHead(404).end();
      return;
    }
    let redisUp = false;
    let dbUp = false;
    let queueDepth = -1;
    try {
      redisUp = (await cache.ping()) === 'PONG';
      queueDepth = await cache.llen(VOTE_QUEUE);
    } catch {
      /* redis down */
    }
    try {
      await pool.query('SELECT 1');
      dbUp = true;
    } catch {
      /* db down */
    }
    const ok = redisUp && dbUp;
    res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: ok ? 'ok' : 'degraded',
        service: 'worker',
        db: dbUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
        processed,
        duplicates,
        queueDepth,
        lastProcessedAt,
      }),
    );
  });
  server.listen(config.healthPort, () => log(`health endpoint on :${config.healthPort}`));
  return server;
}

async function main(): Promise<void> {
  const server = startHealthServer();

  const shutdown = async (signal: string) => {
    log(`received ${signal}, shutting down`);
    running = false;
    server.close();
    await sleep(200);
    blocking.disconnect();
    cache.disconnect();
    await pool.end().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await waitForSchema();
  await consumeLoop();
}

void main().catch((err) => {
  log('fatal', (err as Error).message);
  process.exit(1);
});
