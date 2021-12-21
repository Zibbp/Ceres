import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';

@Module({
  controllers: [QueuesController],
  providers: [QueuesService]
})
export class QueuesModule {}
