import { HttpModule } from '@nestjs/axios';
import { CacheModule, Module } from '@nestjs/common';
import { TwitchService } from './twitch.service';
import { TwitchController } from './twitch.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule, CacheModule.register()],
  providers: [TwitchService, ConfigService],
  controllers: [TwitchController],
})
export class TwitchModule {}
