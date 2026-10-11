import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../auth/guards';
import { AuthUser } from '../auth/jwt.strategy';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VoteService } from './vote.service';

@UseGuards(JwtAuthGuard)
@Controller('votes')
export class VoteController {
  constructor(private readonly votes: VoteService) {}

  @Post()
  cast(@CurrentUser() user: AuthUser, @Body() dto: CastVoteDto) {
    return this.votes.cast(user.id, dto.optionId);
  }
}
