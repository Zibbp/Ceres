import { CacheModule, Module } from '@nestjs/common';
import { VodsService } from './vods.service';
import { VodsController } from './vods.controller';
import { TwitchService } from 'src/twitch/twitch.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { VodsRepository } from './vods.repository';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FilesService } from 'src/files/files.service';
import { ChannelsRepository } from 'src/channels/channels.repository';
import { ChannelsService } from 'src/channels/channels.service';

@Module({
  imports: [TypeOrmModule.forFeature([VodsRepository, ChannelsRepository]), AuthModule, CacheModule.register(), HttpModule],
  controllers: [VodsController],
  providers: [VodsService, TwitchService, ConfigService, FilesService, ChannelsService]
})
export class VodsModule { }
