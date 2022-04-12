import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveRepository } from 'src/live/live.repository';
import { QueuesRepository } from 'src/queues/queues.repository';
import { QueuesService } from 'src/queues/queues.service';
import { UsersRepository } from 'src/users/users.repository';
import { VodsRepository } from 'src/vods/vods.repository';
import { FilesService } from './files.service';

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
  providers: [FilesService, QueuesService],
})
export class FilesModule { }
