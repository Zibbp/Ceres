import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'queue' })
export class Queue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    vodId: string;

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
