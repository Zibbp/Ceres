import { InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { Queue } from "./entities/queue.entity";
import { EntityRepository, Repository } from "typeorm";
import { CreateQueueDto } from './dto/create-queue.dto'
import { InjectRepository } from "@nestjs/typeorm";
import { VodsRepository } from "src/vods/vods.repository";
import { User } from "src/users/entities/user.entity";

@EntityRepository(Queue)
export class QueuesRepository extends Repository<Queue> {
    private logger = new Logger("QueuesRepository");
    @InjectRepository(VodsRepository)
    private readonly vodsRepository: VodsRepository;
    c
    async findAll(completed: boolean): Promise<Queue[]> {

        if (Boolean(completed) == true) {
            return await this.find({ order: { createdAt: "DESC" } });
        } else {
            // return await this.find({ where: { completed: false }, order: { createdAt: "DESC" } });
            return await this.createQueryBuilder('queue').where({ completed: false }).select(['queue', 'user.id', 'user.username', 'user.webhook']).leftJoin('queue.user', 'user').orderBy('queue.createdAt', 'DESC').getMany();
        }

    }

    async createQueueItem(createQueue: CreateQueueDto, user: User): Promise<Queue> {
        const { vodId, title, liveArchive, videoDone, chatDownloadDone, chatRenderDone, completed } = createQueue;
        let queue: Queue;
        try {
            queue = this.create({
                vodId,
                user: user,
                title,
                liveArchive,
                videoDone,
                chatDownloadDone,
                chatRenderDone,
                completed
            });
            await this.save(queue);
        } catch (error) {
            throw new InternalServerErrorException();
        }
        return queue;
    }
    async getQueueItemById(id: string): Promise<Queue> {
        let queue: Queue;
        try {
            queue = await this.findOne({ where: { id } });
        } catch (error) {
            throw new NotFoundException();
        }
        return queue;
    }

}