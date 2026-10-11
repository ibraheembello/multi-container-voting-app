import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';
import { PollService } from '../poll/poll.service';
import { RedisService } from '../redis/redis.service';

export interface OptionResult {
  optionId: string;
  label: string;
  colour: string | null;
  votes: number;
  percentage: number;
}

export interface ResultsPayload {
  pollId: string;
  question: string;
  total: number;
  results: OptionResult[];
  source: 'cache' | 'database';
}

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Vote) private readonly votes: Repository<Vote>,
    private readonly poll: PollService,
    private readonly redis: RedisService,
  ) {}

  async getResults(): Promise<ResultsPayload> {
    const poll = await this.poll.getActivePoll();

    let counts = await this.redis.getCachedCounts();
    let total = await this.redis.getCachedTotal();
    let source: ResultsPayload['source'] = 'cache';

    // Cold cache (e.g. after a Redis restart): rebuild from the database of record.
    if (total === 0) {
      const dbTotal = await this.votes.count();
      if (dbTotal > 0) {
        counts = await this.aggregateFromDb();
        total = dbTotal;
        source = 'database';
        await this.redis.primeCounts(counts, total);
      }
    }

    const results: OptionResult[] = poll.options
      .map((o) => {
        const votes = counts[o.id] ?? 0;
        return {
          optionId: o.id,
          label: o.label,
          colour: o.colour,
          votes,
          percentage: total > 0 ? Math.round((votes / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label));

    return { pollId: poll.id, question: poll.question, total, results, source };
  }

  private async aggregateFromDb(): Promise<Record<string, number>> {
    const rows = await this.votes
      .createQueryBuilder('v')
      .select('v.option_id', 'optionId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('v.option_id')
      .getRawMany<{ optionId: string; count: string }>();
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.optionId] = Number(row.count);
    }
    return counts;
  }
}
