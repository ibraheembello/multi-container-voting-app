import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PollService } from '../poll/poll.service';
import { RedisService } from '../redis/redis.service';

export interface VoteAccepted {
  status: 'accepted';
  optionId: string;
}

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly poll: PollService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Record a vote. One vote per user is enforced atomically: the UPDATE only
   * succeeds when has_voted is still false, so a double-submit can never enqueue
   * twice. The vote itself is persisted asynchronously by the worker; the
   * votes.user_id unique index is the final database-level guarantee.
   */
  async cast(userId: string, optionId: string): Promise<VoteAccepted> {
    // Validates the option belongs to the active poll (throws 404 otherwise).
    await this.poll.getOptionInActivePoll(optionId);

    const update = await this.users.update({ id: userId, hasVoted: false }, { hasVoted: true });
    if (!update.affected) {
      throw new ConflictException('You have already voted');
    }

    await this.redis.enqueueVote({ userId, optionId, ts: Date.now() });
    return { status: 'accepted', optionId };
  }
}
