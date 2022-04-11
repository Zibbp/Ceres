import { Channel } from "src/channels/entities/channel.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Live {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Channel, { onDelete: 'CASCADE' })
    @JoinColumn()
    channel: Channel;

    @ManyToOne(() => User, (user) => user.lives, { onDelete: 'CASCADE' })
    user: User;

    @Column({ default: false })
    live: boolean

    @Column({ nullable: true })
    lastLive: Date
}
