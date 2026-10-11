import { QueuedVote, RESULTS_COUNTS, RESULTS_TOTAL } from './keys';

// Minimal interfaces so the processor can be unit-tested without real pg/redis.
export interface Db {
  query(text: string, params: unknown[]): Promise<{ rowCount: number | null }>;
}
export interface Cache {
  hincrby(key: string, field: string, increment: number): Promise<number>;
  incr(key: string): Promise<number>;
}

export type ProcessOutcome = 'persisted' | 'duplicate';

/**
 * Persist one queued vote and update the results cache.
 *
 * The INSERT uses ON CONFLICT (user_id) DO NOTHING, so replaying the same vote
 * (at-least-once delivery, retries) never double-counts: the cache is only
 * incremented when a brand-new row was actually written.
 */
export async function processVote(
  db: Db,
  cache: Cache,
  vote: QueuedVote,
): Promise<ProcessOutcome> {
  const result = await db.query(
    `INSERT INTO votes (id, user_id, option_id, created_at)
     VALUES (gen_random_uuid(), $1, $2, now())
     ON CONFLICT (user_id) DO NOTHING
     RETURNING id`,
    [vote.userId, vote.optionId],
  );

  if (result.rowCount && result.rowCount > 0) {
    await cache.hincrby(RESULTS_COUNTS, vote.optionId, 1);
    await cache.incr(RESULTS_TOTAL);
    return 'persisted';
  }
  return 'duplicate';
}
