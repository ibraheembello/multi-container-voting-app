import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';
import { PollService } from '../poll/poll.service';
import { RedisService } from '../redis/redis.service';
import { ResultsService } from './results.service';

const POLL = {
  id: 'poll-1',
  question: 'Which cloud do you build on?',
  options: [
    { id: 'opt-aws', label: 'AWS', colour: '#FF9900' },
    { id: 'opt-az', label: 'Azure', colour: '#0089D6' },
  ],
};

describe('ResultsService', () => {
  let service: ResultsService;
  let votes: jest.Mocked<Pick<Repository<Vote>, 'count' | 'createQueryBuilder'>>;
  let redis: jest.Mocked<Pick<RedisService, 'getCachedCounts' | 'getCachedTotal' | 'primeCounts'>>;

  beforeEach(async () => {
    votes = { count: jest.fn(), createQueryBuilder: jest.fn() };
    redis = {
      getCachedCounts: jest.fn(),
      getCachedTotal: jest.fn(),
      primeCounts: jest.fn().mockResolvedValue(undefined),
    };
    const poll: Pick<PollService, 'getActivePoll'> = {
      getActivePoll: jest.fn().mockResolvedValue(POLL),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: getRepositoryToken(Vote), useValue: votes },
        { provide: RedisService, useValue: redis },
        { provide: PollService, useValue: poll },
      ],
    }).compile();

    service = moduleRef.get(ResultsService);
  });

  it('serves from cache, sorts by votes desc, and computes percentages', async () => {
    redis.getCachedCounts.mockResolvedValue({ 'opt-aws': 3, 'opt-az': 1 });
    redis.getCachedTotal.mockResolvedValue(4);

    const payload = await service.getResults();

    expect(payload.source).toBe('cache');
    expect(payload.total).toBe(4);
    expect(payload.results[0]).toMatchObject({ optionId: 'opt-aws', votes: 3, percentage: 75 });
    expect(payload.results[1]).toMatchObject({ optionId: 'opt-az', votes: 1, percentage: 25 });
    expect(votes.count).not.toHaveBeenCalled();
  });

  it('rebuilds from the database on a cold cache and primes it', async () => {
    redis.getCachedCounts.mockResolvedValue({});
    redis.getCachedTotal.mockResolvedValue(0);
    votes.count.mockResolvedValue(2);
    votes.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ optionId: 'opt-aws', count: '2' }]),
    } as never);

    const payload = await service.getResults();

    expect(payload.source).toBe('database');
    expect(payload.total).toBe(2);
    expect(redis.primeCounts).toHaveBeenCalledWith({ 'opt-aws': 2 }, 2);
    expect(payload.results[0]).toMatchObject({ optionId: 'opt-aws', votes: 2, percentage: 100 });
  });

  it('returns zeroed results when no votes exist yet', async () => {
    redis.getCachedCounts.mockResolvedValue({});
    redis.getCachedTotal.mockResolvedValue(0);
    votes.count.mockResolvedValue(0);

    const payload = await service.getResults();

    expect(payload.total).toBe(0);
    expect(payload.results.every((r) => r.votes === 0 && r.percentage === 0)).toBe(true);
    expect(redis.primeCounts).not.toHaveBeenCalled();
  });
});
