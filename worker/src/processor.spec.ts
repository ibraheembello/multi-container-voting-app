import { Cache, Db, processVote } from './processor';
import { QueuedVote } from './keys';

const VOTE: QueuedVote = { userId: 'u1', optionId: 'o1', ts: Date.now() };

function makeCache(): jest.Mocked<Cache> {
  return { hincrby: jest.fn().mockResolvedValue(1), incr: jest.fn().mockResolvedValue(1) };
}

describe('processVote', () => {
  it('persists a new vote and increments the cache once', async () => {
    const db: Db = { query: jest.fn().mockResolvedValue({ rowCount: 1 }) };
    const cache = makeCache();

    const outcome = await processVote(db, cache, VOTE);

    expect(outcome).toBe('persisted');
    expect(cache.hincrby).toHaveBeenCalledWith('results:counts', 'o1', 1);
    expect(cache.incr).toHaveBeenCalledWith('results:total');
  });

  it('is idempotent: a duplicate insert does not touch the cache', async () => {
    const db: Db = { query: jest.fn().mockResolvedValue({ rowCount: 0 }) };
    const cache = makeCache();

    const outcome = await processVote(db, cache, VOTE);

    expect(outcome).toBe('duplicate');
    expect(cache.hincrby).not.toHaveBeenCalled();
    expect(cache.incr).not.toHaveBeenCalled();
  });
});
