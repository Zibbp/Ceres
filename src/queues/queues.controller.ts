import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueuesService } from './queues.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller({ path: 'queues', version: '1' })
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) { }

  @Get()
  findAll(@Query('completed') completed: boolean) {
    return this.queuesService.findAll(completed);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queuesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQueueDto: UpdateQueueDto) {
    return this.queuesService.update(+id, updateQueueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queuesService.remove(+id);
  }

  @Get('/logs/:name')
  findLogs(@Param('name') name: string) {
    return this.queuesService.findLogs(name);
  }
}
