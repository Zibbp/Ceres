import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelsRepository } from 'src/channels/channels.repository';
import { QueuesRepository } from 'src/queues/queues.repository';
import { VodsRepository } from 'src/vods/vods.repository';

@Injectable()
export class MetricsService {
  private logger = new Logger('MetricsService');

  constructor(
    @InjectRepository(ChannelsRepository)
    private readonly channelsRepository: ChannelsRepository,
    @InjectRepository(QueuesRepository)
    private readonly queuesRepository: QueuesRepository,
    @InjectRepository(VodsRepository)
    private readonly vodsRepository: VodsRepository,
  ) {}
  async getMetrics() {
    try {
      const vodCount = await this.vodsRepository
        .createQueryBuilder('vods')
        .getCount();
      const channelCount = await this.channelsRepository
        .createQueryBuilder('channels')
        .getCount();
      const channels = await this.channelsRepository
        .createQueryBuilder('channel')
        .loadRelationCountAndMap('channel.vodCount', 'channel.vods', 'vod')
        .getMany();

      let channelsString = '';

      for await (const channel of channels) {
        channelsString += `channel_vod_count{id="${channel.displayName}"} ${channel['vodCount']}\n`;
      }

      const metrics =
        `vod_count{id="ceres"} ${vodCount}\nchannel_count{id="ceres"} ${channelCount}\n${channelsString}`.toString();
      return metrics;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error fetching metrics');
    }
  }
}
