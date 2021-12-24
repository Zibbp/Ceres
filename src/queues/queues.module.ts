import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VodsRepository } from 'src/vods/vods.repository';
import { QueuesRepository } from './queues.repository';
import { UsersRepository } from 'src/users/users.repository';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([VodsRepository, QueuesRepository, UsersRepository]), HttpModule],
  controllers: [QueuesController],
  providers: [QueuesService]
})
export class QueuesModule { }
