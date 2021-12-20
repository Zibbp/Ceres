import { CacheModule, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { AuthModule } from 'src/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/auth/roles.guard';
import { TwitchService } from 'src/twitch/twitch.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsRepository } from './channels.repository';
import { FilesService } from 'src/files/files.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelsRepository]), AuthModule, CacheModule.register(), HttpModule,],
  controllers: [ChannelsController],
  providers: [ChannelsService, TwitchService, ConfigService, FilesService]
})
export class ChannelsModule { }
