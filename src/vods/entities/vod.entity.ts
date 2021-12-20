import { Channel } from 'src/channels/entities/channel.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BroadcastType {
  ARCHIVE = 'archive',
  LIVE = 'live',
}

export enum StatusType {
  RECORDED = 'recorded',
  LIVE = 'live',
}

@Entity({ name: 'vods' })
export class Vod {
  @PrimaryColumn({ unique: true })
  id: string;

  @ManyToOne(() => Channel, (channel) => channel.vods)
  channel: Channel;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: BroadcastType,
  })
  broadcastType: BroadcastType;

  @Column({
    type: 'enum',
    enum: StatusType,
  })
  status: StatusType;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
