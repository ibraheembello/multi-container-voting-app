import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Option } from '../entities/option.entity';
import { Poll } from '../entities/poll.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Poll) private readonly polls: Repository<Poll>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPoll();
    await this.seedAdmin();
  }

  private async seedPoll(): Promise<void> {
    const existing = await this.polls.count();
    if (existing > 0) {
      return;
    }
    const poll = this.polls.create({
      question: 'Which cloud do you build on?',
      isActive: true,
      options: [
        { label: 'Amazon Web Services', colour: '#FF9900' } as Option,
        { label: 'Microsoft Azure', colour: '#0089D6' } as Option,
        { label: 'Google Cloud', colour: '#34A853' } as Option,
        { label: 'On-prem / Other', colour: '#A855F7' } as Option,
      ],
    });
    await this.polls.save(poll);
    this.logger.log('Seeded default poll "Which cloud do you build on?"');
  }

  private async seedAdmin(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping admin seed');
      return;
    }
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.users.save(this.users.create({ email, passwordHash, role: 'admin' }));
    this.logger.log(`Seeded admin account ${email}`);
  }
}
