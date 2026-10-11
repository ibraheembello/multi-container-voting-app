import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Option } from './option.entity';
import { User } from './user.entity';

@Entity({ name: 'votes' })
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // One vote per user: a unique index is the database-level guarantee.
  @OneToOne(() => User, (user) => user.vote, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @ManyToOne(() => Option, (option) => option.votes, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'option_id' })
  option!: Option;

  @Column({ name: 'option_id' })
  optionId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
