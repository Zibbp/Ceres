import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { UsersRepository } from 'src/users/users.repository';
import { Vod } from 'src/vods/entities/vod.entity';
import { VodsRepository } from 'src/vods/vods.repository';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { Queue } from './entities/queue.entity';
import { QueuesRepository } from './queues.repository';

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
    private httpService: HttpService
  ) { }

  async findAll(completed: boolean) {
    let queues: Queue[]
    try {
      queues = await this.queuesRepository.findAll(completed);
    } catch (error) {
      throw new InternalServerErrorException()
    }
    return queues;
  }

  async updateProgress(id: string, item: string) {
    const queueItem = await this.queuesRepository.createQueryBuilder('queue').where({ id: id }).select(['queue', 'user.id', 'user.username', 'user.webhook']).leftJoin('queue.user', 'user').getOne()

    switch (item) {
      case 'video':
        this.logger.verbose(`Updating video progress for queue item ${id}. Video done`);
        queueItem.videoDone = true;
        break;
      case 'chatDownload':
        this.logger.verbose(`Updating video progress for queue item ${id}. Chat download done`);
        queueItem.chatDownloadDone = true;
        break;
      case 'chatRender':
        this.logger.verbose(`Updating video progress for queue item ${id}. Chat render done.`);
        queueItem.chatRenderDone = true;
        break;
      default:
        break;
    }
    try {
      if (queueItem.videoDone && queueItem.chatDownloadDone && queueItem.chatRenderDone) {
        this.logger.verbose(`Updating video progress for queue item ${id}. All done.`);
        queueItem.completed = true;
        // Update vod status to completed
        this.logger.verbose(`Updating vod status for queue item ${id}.`);
        const vod = await this.vodsRepository.getVodById(queueItem.vodId);
        vod.downloading = false;
        await this.vodsRepository.save(vod)
        // Send webhook to notify that the vod is ready
        this.logger.verbose(`Sending webhook for queue item ${id}.`);
        await this.sendWebhook(queueItem.user.webhook, vod)
      }
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException();
    }
    await this.queuesRepository.save(queueItem);
  }

  findOne(id: number) {
    return `This action returns a #${id} queue`;
  }

  update(id: number, updateQueueDto: UpdateQueueDto) {
    return `This action updates a #${id} queue`;
  }

  remove(id: number) {
    return `This action removes a #${id} queue`;
  }
  async sendWebhook(webhookUrl: string, vod: Vod) {
    try {
      const embeds = [
        {
          title: "VOD Archived",
          color: 5174599,
          fields: [
            {
              name: "Channel",
              value: vod.channel.displayName
            },
            {
              name: "ID",
              value: vod.id
            },
            {
              name: "Title",
              value: vod.title
            }
          ],
        },
      ]
      const webhookReq = this.httpService.post(webhookUrl, { embeds });
      await firstValueFrom(webhookReq);
    } catch (error) {
      console.log(error)
      this.logger.error(`error sending webhook for vod ${vod.id}`)
    }

  }
}

