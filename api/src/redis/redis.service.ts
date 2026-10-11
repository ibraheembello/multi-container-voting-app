import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { QueuedVote, RESULTS_COUNTS, RESULTS_TOTAL, VOTE_QUEUE } from './redis.keys';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  /** Push a vote onto the queue for the worker to persist asynchronously. */
  async enqueueVote(vote: QueuedVote): Promise<void> {
    await this.client.lpush(VOTE_QUEUE, JSON.stringify(vote));
  }

  /** Read the cached per-option counts the worker maintains (may be empty). */
  async getCachedCounts(): Promise<Record<string, number>> {
    const raw = await this.client.hgetall(RESULTS_COUNTS);
    const counts: Record<string, number> = {};
    for (const [optionId, value] of Object.entries(raw)) {
      counts[optionId] = Number(value) || 0;
    }
    return counts;
  }

  async getCachedTotal(): Promise<number> {
    const raw = await this.client.get(RESULTS_TOTAL);
    return Number(raw) || 0;
  }

  /** Warm the cache from an authoritative source (used on a cache miss). */
  async primeCounts(counts: Record<string, number>, total: number): Promise<void> {
    const pipeline = this.client.pipeline();
    pipeline.del(RESULTS_COUNTS);
    for (const [optionId, value] of Object.entries(counts)) {
      pipeline.hset(RESULTS_COUNTS, optionId, value);
    }
    pipeline.set(RESULTS_TOTAL, total);
    await pipeline.exec();
  }

  async ping(): Promise<boolean> {
    const pong = await this.client.ping();
    return pong === 'PONG';
  }

  async queueDepth(): Promise<number> {
    return this.client.llen(VOTE_QUEUE);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
