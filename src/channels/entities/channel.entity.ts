import { Queue } from 'src/queues/entities/queue.entity';
import { Vod } from 'src/vods/entities/vod.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'channels' })
export class Channel {
  @PrimaryColumn({ unique: true })
  id: string;

  @OneToMany(() => Vod, (vod) => vod.channel, { onDelete: 'CASCADE' })
  vods: Vod[];

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  displayName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  profileImagePath: string;

  @Column({ nullable: true })
  offlineImagePath: string;

  @Column({ nullable: true })
  channelCreatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
