import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { UsersRepository } from 'src/users/users.repository';
import { Vod } from 'src/vods/entities/vod.entity';
import { VodsRepository } from 'src/vods/vods.repository';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { Queue } from './entities/queue.entity';
import { QueuesRepository } from './queues.repository';
import * as fs from 'fs';


@Injectable()
export class QueuesService {
  private logger = new Logger('QueuesService');
  constructor(
    @InjectRepository(QueuesRepository)
    private queuesRepository: QueuesRepository,
    @InjectRepository(VodsRepository)
    private vodsRepository: VodsRepository,
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private httpService: HttpService,
  ) { }

  async findAll(completed: boolean) {
    let queues: Queue[];
    try {
      queues = await this.queuesRepository.findAll(completed);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return queues;
  }

  async updateProgress(id: string, item: string) {
    const queueItem = await this.queuesRepository
      .createQueryBuilder('queue')
      .where({ id: id })
      .select(['queue', 'user.id', 'user.username', 'user.webhook'])
      .leftJoin('queue.user', 'user')
      .getOne();

    switch (item) {
      case 'video':
        this.logger.verbose(
          `Updating video progress for queue item ${id}. Video done`,
        );
        queueItem.videoDone = true;
        break;
      case 'chatDownload':
        this.logger.verbose(
          `Updating video progress for queue item ${id}. Chat download done`,
        );
        queueItem.chatDownloadDone = true;
        break;
      case 'chatRender':
        this.logger.verbose(
          `Updating video progress for queue item ${id}. Chat render done.`,
        );
        queueItem.chatRenderDone = true;
        break;
      default:
        break;
    }
    try {
      if (
        queueItem.videoDone &&
        queueItem.chatDownloadDone &&
        queueItem.chatRenderDone
      ) {
        this.logger.verbose(
          `Updating video progress for queue item ${id}. All done.`,
        );
        queueItem.completed = true;
        // Update vod status to completed
        this.logger.verbose(`Updating vod status for queue item ${id}.`);
        const vod = await this.vodsRepository.getVodById(queueItem.vodId);
        vod.downloading = false;
        await this.vodsRepository.save(vod);
        // Send webhook to notify that the vod is ready
        if (queueItem.user.webhook) {
          this.logger.verbose(`Sending webhook for queue item ${id}.`);
          await this.sendWebhook(queueItem.user.webhook, vod);
        }
      }
    } catch (error) {
      this.logger.error("Error updating queue item final status or sending webhook", error);
    }
    await this.queuesRepository.save(queueItem);
  }

  async findOne(id: string) {
    let queueItem
    try {
      queueItem = await this.queuesRepository.findOneOrFail(id)
    } catch (error) {
      throw new NotFoundException(`Queue with id ${id} not found`);
    }
    return queueItem;
  }

  async update(id: string, updateQueueDto: UpdateQueueDto) {
    let queue = await this.findOne(id)
    queue.liveArchive = updateQueueDto.liveArchive
    queue.videoDone = updateQueueDto.videoDone
    queue.chatDownloadDone = updateQueueDto.chatDownloadDone
    queue.chatRenderDone = updateQueueDto.chatRenderDone
    queue.completed = updateQueueDto.completed

    try {
      await this.queuesRepository.save(queue)
    } catch (error) {
      throw new InternalServerErrorException('Error updating queue item.')
    }
    return queue;
  }

  async remove(id: string) {
    const queue = await this.findOne(id)
    try {
      await this.queuesRepository.delete(queue.id)
    } catch (error) {
      this.logger.error(`Error deleting queue item ${id} ${error}`)
      throw new InternalServerErrorException('Error deleting queue item.')
    }
    return;
  }
  // Not the most efficient way to do this, but it works for now.
  // TODO: refactor this to use a stream instead of loading it all in memory at once.
  async findLogs(name: string) {
    try {
      const log = await fs.readFileSync(`/logs/${name}.log`, 'utf8');
      const arr = log.toString().split(/\r\n|\r|\n/)
      return arr.slice(-50);
    } catch (error) {
      if (error.errno === -2) {
        throw new NotFoundException('Log file not found');
      } else {
        console.log(error);
        throw new InternalServerErrorException('Error fetching log file.')
      }
    }
  }
  async sendWebhook(webhookUrl: string, vod: Vod) {
    try {
      const embeds = [
        {
          title: 'VOD Archived',
          color: 5174599,
          fields: [
            {
              name: 'Channel',
              value: vod.channel.displayName,
            },
            {
              name: 'ID',
              value: vod.id,
            },
            {
              name: 'Title',
              value: vod.title,
            },
          ],
        },
      ];
      const webhookReq = this.httpService.post(webhookUrl, { embeds });
      await firstValueFrom(webhookReq);
    } catch (error) {
      console.log(error);
      this.logger.error(`error sending webhook for vod ${vod.id}`);
    }
  }
}
