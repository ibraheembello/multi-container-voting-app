import { Controller, Get } from '@nestjs/common';
import { PollService } from './poll.service';

@Controller('poll')
export class PollController {
  constructor(private readonly poll: PollService) {}

  @Get()
  async getActivePoll() {
    const poll = await this.poll.getActivePoll();
    return {
      id: poll.id,
      question: poll.question,
      options: poll.options
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((o) => ({ id: o.id, label: o.label, colour: o.colour })),
    };
  }
}
