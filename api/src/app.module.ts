import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { Option } from './entities/option.entity';
import { Poll } from './entities/poll.entity';
import { User } from './entities/user.entity';
import { Vote } from './entities/vote.entity';
import { HealthModule } from './health/health.module';
import { PollModule } from './poll/poll.module';
import { RedisModule } from './redis/redis.module';
import { ResultsModule } from './results/results.module';
import { SeedModule } from './seed/seed.module';
import { VoteModule } from './vote/vote.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Poll, Option, Vote],
        // Capstone scope: schema is kept in sync from the entities. For a larger
        // system this would move to explicit migrations.
        synchronize: true,
        // The DB container may still be starting on first boot; retry instead of crashing.
        retryAttempts: 15,
        retryDelay: 3000,
      }),
    }),
    RedisModule,
    AuthModule,
    PollModule,
    VoteModule,
    ResultsModule,
    AdminModule,
    HealthModule,
    SeedModule,
  ],
})
export class AppModule {}
