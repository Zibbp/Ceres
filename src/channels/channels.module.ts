import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService]
})
export class ChannelsModule {}
