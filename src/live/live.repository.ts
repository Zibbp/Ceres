import {
    ConflictException,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Live } from './entities/live.entity';
import { EntityRepository, Repository } from 'typeorm';
import { Channel } from 'src/channels/entities/channel.entity';
import { User } from 'src/users/entities/user.entity';

@EntityRepository(Live)
export class LiveRepository extends Repository<Live> {
    private logger = new Logger('LiveRepository');
    async createLiveChannelWatch(channel: Channel, user: User): Promise<Live> {
        try {
            const live = this.create({
                channel,
                user,
                live: false,
            });
            await this.save(live);
            return live;
        } catch (error) {
            if (error.code === '23505') {
                //duplicate
                throw new ConflictException('Channel is already set to be watched.');
            }
            this.logger.error('Error creating channel', error);
            throw new InternalServerErrorException("Error creating channel");
        }
    }
    async removeLiveChannelWatch(channel: Channel) {
        try {
            const live = await this.findOne({
                where: {
                    channel,
                },
            });
            await this.remove(live);
        } catch (error) {
            this.logger.error('Error removing channel', error);
            throw new InternalServerErrorException("Error removing channel");
        }
    }
    async findAll() {
        return await this.find({ relations: ['channel'] });
    }
    async findAllNotLive() {
        return await this.find({
            where: {
                live: false,
            },
            relations: ['channel', 'user'],
        });
    }
    async updateLiveChannelStatus(channel: Channel, status: boolean): Promise<Live> {
        try {
            const live = await this.findOne({
                where: {
                    channel,
                },
                relations: ['channel'],
            });
            live.live = status;
            await this.save(live);
            return live;
        } catch (error) {
            this.logger.error('Error updating channel', error);
        }
    }
}