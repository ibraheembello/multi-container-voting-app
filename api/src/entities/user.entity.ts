import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vote } from './vote.entity';

export type UserRole = 'user' | 'admin';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', default: 'user' })
  role!: UserRole;

  // Fast guard for one-vote-per-user; the Vote.userId unique index is the hard guarantee.
  @Column({ name: 'has_voted', default: false })
  hasVoted!: boolean;

  @OneToOne(() => Vote, (vote) => vote.user)
  vote?: Vote;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
