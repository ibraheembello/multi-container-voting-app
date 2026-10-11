import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PollService } from '../poll/poll.service';
import { RedisService } from '../redis/redis.service';
import { VoteService } from './vote.service';

describe('VoteService', () => {
  let service: VoteService;
  let users: jest.Mocked<Pick<Repository<User>, 'update'>>;
  let redis: jest.Mocked<Pick<RedisService, 'enqueueVote'>>;
  let poll: jest.Mocked<Pick<PollService, 'getOptionInActivePoll'>>;

  const OPTION_ID = '11111111-1111-4111-8111-111111111111';
  const USER_ID = '22222222-2222-4222-8222-222222222222';

  beforeEach(async () => {
    users = { update: jest.fn() };
    redis = { enqueueVote: jest.fn().mockResolvedValue(undefined) };
    poll = { getOptionInActivePoll: jest.fn().mockResolvedValue({ id: OPTION_ID }) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        VoteService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: RedisService, useValue: redis },
        { provide: PollService, useValue: poll },
      ],
    }).compile();

    service = moduleRef.get(VoteService);
  });

  it('accepts a first-time vote and enqueues it exactly once', async () => {
    users.update.mockResolvedValue({ affected: 1 } as never);

    const result = await service.cast(USER_ID, OPTION_ID);

    expect(result).toEqual({ status: 'accepted', optionId: OPTION_ID });
    expect(poll.getOptionInActivePoll).toHaveBeenCalledWith(OPTION_ID);
    expect(users.update).toHaveBeenCalledWith({ id: USER_ID, hasVoted: false }, { hasVoted: true });
    expect(redis.enqueueVote).toHaveBeenCalledTimes(1);
    expect(redis.enqueueVote).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, optionId: OPTION_ID }),
    );
  });

  it('rejects a second vote and never enqueues it (atomic guard)', async () => {
    users.update.mockResolvedValue({ affected: 0 } as never);

    await expect(service.cast(USER_ID, OPTION_ID)).rejects.toBeInstanceOf(ConflictException);
    expect(redis.enqueueVote).not.toHaveBeenCalled();
  });

  it('validates the option before touching the user (invalid option bubbles up)', async () => {
    poll.getOptionInActivePoll.mockRejectedValue(new Error('not found'));

    await expect(service.cast(USER_ID, OPTION_ID)).rejects.toThrow('not found');
    expect(users.update).not.toHaveBeenCalled();
    expect(redis.enqueueVote).not.toHaveBeenCalled();
  });
});
