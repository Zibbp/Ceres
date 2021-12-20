import { Module } from '@nestjs/common';
import { VodsService } from './vods.service';
import { VodsController } from './vods.controller';

@Module({
  controllers: [VodsController],
  providers: [VodsService]
})
export class VodsModule {}
