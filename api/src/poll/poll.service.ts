import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Option } from '../entities/option.entity';
import { Poll } from '../entities/poll.entity';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(Poll) private readonly polls: Repository<Poll>,
    @InjectRepository(Option) private readonly options: Repository<Option>,
  ) {}

  /** The single active poll with its options. */
  async getActivePoll(): Promise<Poll> {
    const poll = await this.polls.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    if (!poll) {
      throw new NotFoundException('No active poll');
    }
    return poll;
  }

  async getOptionInActivePoll(optionId: string): Promise<Option> {
    const poll = await this.getActivePoll();
    const option = await this.options.findOne({
      where: { id: optionId, pollId: poll.id },
    });
    if (!option) {
      throw new NotFoundException('That option is not part of the active poll');
    }
    return option;
  }
}
