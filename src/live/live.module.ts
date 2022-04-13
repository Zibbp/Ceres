import { CacheModule, Module } from '@nestjs/common';
import { LiveService } from './live.service';
import { LiveController } from './live.controller';
import { LiveRepository } from './live.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelsRepository } from 'src/channels/channels.repository';
import { TwitchService } from 'src/twitch/twitch.service';
import { FilesService } from 'src/files/files.service';
import { ConfigService } from '@nestjs/config';
import { VodsService } from 'src/vods/vods.service';
import { VodsRepository } from 'src/vods/vods.repository';
import { QueuesRepository } from 'src/queues/queues.repository';
import { ExecService } from 'src/exec/exec.service';
import { QueuesService } from 'src/queues/queues.service';
import { UsersRepository } from 'src/users/users.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveRepository, ChannelsRepository, VodsRepository, QueuesRepository, UsersRepository]),
    AuthModule,
    CacheModule.register(),
    HttpModule,
  ],
  controllers: [LiveController],
  providers: [LiveService, ChannelsService, TwitchService, FilesService, ConfigService, VodsService, ExecService, QueuesService]
})
export class LiveModule { }
