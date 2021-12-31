import { PartialType } from '@nestjs/mapped-types';
import { CreateQueueDto } from './create-queue.dto';

export class UpdateQueueDto extends PartialType(CreateQueueDto) {}
