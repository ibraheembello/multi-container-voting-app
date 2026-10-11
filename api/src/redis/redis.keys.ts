// Shared Redis key contract between the API (producer + cache reader) and the
// worker (consumer + cache writer). Keep these in sync with worker/src/keys.ts.
export const VOTE_QUEUE = 'votes:queue'; // LIST, votes waiting to be persisted
export const RESULTS_COUNTS = 'results:counts'; // HASH optionId -> count
export const RESULTS_TOTAL = 'results:total'; // STRING integer, total votes
export const RESULTS_CACHE_TTL_SECONDS = 10; // leaderboard cache freshness window

export interface QueuedVote {
  userId: string;
  optionId: string;
  ts: number;
}
