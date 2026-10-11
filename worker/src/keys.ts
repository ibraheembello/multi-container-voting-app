// Redis key contract shared with the API. Keep in sync with api/src/redis/redis.keys.ts.
export const VOTE_QUEUE = 'votes:queue';
export const RESULTS_COUNTS = 'results:counts';
export const RESULTS_TOTAL = 'results:total';

export interface QueuedVote {
  userId: string;
  optionId: string;
  ts: number;
}

export function parseQueuedVote(raw: string): QueuedVote | null {
  try {
    const value = JSON.parse(raw) as Partial<QueuedVote>;
    if (typeof value.userId === 'string' && typeof value.optionId === 'string') {
      return { userId: value.userId, optionId: value.optionId, ts: Number(value.ts) || Date.now() };
    }
    return null;
  } catch {
    return null;
  }
}
