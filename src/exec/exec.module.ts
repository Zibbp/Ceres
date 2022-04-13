import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from 'src/files/files.service';
import { LiveRepository } from 'src/live/live.repository';
import { QueuesRepository } from 'src/queues/queues.repository';
import { QueuesService } from 'src/queues/queues.service';
import { UsersRepository } from 'src/users/users.repository';
import { VodsRepository } from 'src/vods/vods.repository';
import { ExecService } from './exec.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QueuesRepository,
      VodsRepository,
      UsersRepository,
      LiveRepository
    ]),
    HttpModule,
  ],
  providers: [ExecService, QueuesService, FilesService, ConfigService],
})
export class ExecModule { }
