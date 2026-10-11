import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Option } from './option.entity';

@Entity({ name: 'polls' })
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  question!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Option, (option) => option.poll, { cascade: true, eager: true })
  options!: Option[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
