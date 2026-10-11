import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { ResultsModule } from '../results/results.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Vote]), ResultsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
