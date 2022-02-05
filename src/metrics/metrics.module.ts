import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VodsRepository } from 'src/vods/vods.repository';
import { QueuesRepository } from 'src/queues/queues.repository';
import { ChannelsRepository } from 'src/channels/channels.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VodsRepository,
      QueuesRepository,
      ChannelsRepository,
    ]),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
