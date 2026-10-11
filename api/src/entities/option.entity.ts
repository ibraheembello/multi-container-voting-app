import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Poll } from './poll.entity';
import { Vote } from './vote.entity';

@Entity({ name: 'options' })
export class Option {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  label!: string;

  // Optional accent colour the frontend uses for the option's bar/card.
  @Column({ type: 'varchar', nullable: true })
  colour!: string | null;

  @ManyToOne(() => Poll, (poll) => poll.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poll_id' })
  poll!: Poll;

  @Column({ name: 'poll_id' })
  pollId!: string;

  @OneToMany(() => Vote, (vote) => vote.option)
  votes!: Vote[];
}
