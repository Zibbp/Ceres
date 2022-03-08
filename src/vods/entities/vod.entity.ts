import { Channel } from 'src/channels/entities/channel.entity';
import { Queue } from 'src/queues/entities/queue.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BroadcastType {
  ARCHIVE = 'archive',
  LIVE = 'live',
}

@Entity({ name: 'vods' })
export class Vod {
  @PrimaryColumn({ unique: true })
  id: string;

  @ManyToOne(() => Channel, (channel) => channel.vods, { onDelete: 'CASCADE' })
  channel: Channel;

  // @OneToMany(() => Queue, (queue) => queue.vod)
  // queue: Queue;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: BroadcastType,
  })
  broadcastType: BroadcastType;

  @Column()
  duration: number;

  @Column()
  viewCount: number;

  @Column({ nullable: true })
  resolution: string;

  @Column()
  downloading: boolean;

  @Column()
  thumbnailPath: string;

  @Column()
  webThumbnailPath: string;

  @Column()
  videoPath: string;

  @Column({ nullable: true })
  chatPath: string;

  @Column({ nullable: true })
  chatVideoPath: string;

  @Column({ nullable: true })
  vodInfoPath: string;

  @Column()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
