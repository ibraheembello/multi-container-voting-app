import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  // Loosely typed so jest implementations do not have to satisfy TypeORM's
  // overloaded create()/save() signatures.
  let users: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    users = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'user-1', role: 'user', ...x })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed.jwt') } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('registers a new user, lower-cases the email, and returns a token', async () => {
    users.findOne.mockResolvedValue(null);

    const result = await service.register({ email: 'Jane@Example.COM', password: 'password123' });

    expect(users.save).toHaveBeenCalled();
    const saved = users.save.mock.calls[0][0] as User;
    expect(saved.email).toBe('jane@example.com');
    expect(saved.passwordHash).not.toBe('password123');
    expect(result.token).toBe('signed.jwt');
    expect(result.user.email).toBe('jane@example.com');
  });

  it('rejects registration when the email already exists', async () => {
    users.findOne.mockResolvedValue({ id: 'existing' } as User);

    await expect(
      service.register({ email: 'taken@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('logs in with correct credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    users.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash,
      role: 'user',
      hasVoted: false,
    } as User);

    const result = await service.login({ email: 'jane@example.com', password: 'password123' });
    expect(result.token).toBe('signed.jwt');
  });

  it('rejects login with a wrong password', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    users.findOne.mockResolvedValue({ passwordHash } as User);

    await expect(
      service.login({ email: 'jane@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login for an unknown account', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'ghost@example.com', password: 'whatever12' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
