import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VodsRepository } from 'src/vods/vods.repository';
import { QueuesRepository } from './queues.repository';
import { UsersRepository } from 'src/users/users.repository';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { LiveRepository } from 'src/live/live.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VodsRepository,
      QueuesRepository,
      UsersRepository,
      LiveRepository
    ]),
    HttpModule,
    AuthModule
  ],
  controllers: [QueuesController],
  providers: [QueuesService],
})
export class QueuesModule { }
