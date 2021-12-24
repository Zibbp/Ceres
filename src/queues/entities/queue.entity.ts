import { User } from "src/users/entities/user.entity";
import { Vod } from "src/vods/entities/vod.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'queue' })
export class Queue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    vodId: string;

    @ManyToOne(() => User, (user) => user.queues)
    user: User;

    // @ManyToOne(() => Vod, (vod) => vod.queue)
    // vod: Vod;

    @Column({ nullable: true })
    title: string

    @Column({ default: false })
    public liveArchive: boolean

    @Column({ default: false })
    public videoDone: boolean

    @Column({ default: false })
    public chatDownloadDone: boolean

    @Column({ default: false })
    public chatRenderDone: boolean

    @Column({ default: false })
    public completed: boolean

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
