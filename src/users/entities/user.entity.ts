import { Live } from 'src/live/entities/live.entity';
import { Queue } from 'src/queues/entities/queue.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  ARCHIVER = 'archiver',
  USER = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Queue, (queue) => queue.user, { onDelete: 'SET NULL' })
  queues: Queue[];

  @OneToMany(() => Live, (live) => live.user, { onDelete: 'CASCADE' })
  lives: Live[];

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  webhook: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  roles: UserRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
