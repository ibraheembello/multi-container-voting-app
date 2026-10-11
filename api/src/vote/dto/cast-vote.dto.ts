import { IsUUID } from 'class-validator';

export class CastVoteDto {
  @IsUUID('4', { message: 'optionId must be a valid option id' })
  optionId!: string;
}
