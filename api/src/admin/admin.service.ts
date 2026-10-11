import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { RedisService } from '../redis/redis.service';
import { ResultsService } from '../results/results.service';

export interface AdminStats {
  totalUsers: number;
  totalVotes: number;
  turnout: number;
  queueDepth: number;
  results: Awaited<ReturnType<ResultsService['getResults']>>;
  recentVotes: { voter: string; option: string; at: string }[];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Vote) private readonly votes: Repository<Vote>,
    private readonly results: ResultsService,
    private readonly redis: RedisService,
  ) {}

  async getStats(): Promise<AdminStats> {
    const [totalUsers, totalVotes, results, queueDepth, recent] = await Promise.all([
      this.users.count(),
      this.votes.count(),
      this.results.getResults(),
      this.redis.queueDepth(),
      this.votes.find({
        order: { createdAt: 'DESC' },
        take: 10,
        relations: { user: true, option: true },
      }),
    ]);

    return {
      totalUsers,
      totalVotes,
      turnout: totalUsers > 0 ? Math.round((totalVotes / totalUsers) * 1000) / 10 : 0,
      queueDepth,
      results,
      recentVotes: recent.map((v) => ({
        voter: maskEmail(v.user?.email ?? 'unknown'),
        option: v.option?.label ?? 'unknown',
        at: v.createdAt.toISOString(),
      })),
    };
  }
}

/** Mask an email for display: jane.doe@x.com -> j***e@x.com */
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain || name.length <= 2) {
    return `${name[0] ?? '*'}***@${domain ?? ''}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}
