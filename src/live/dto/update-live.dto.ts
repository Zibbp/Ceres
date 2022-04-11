import { PartialType } from '@nestjs/mapped-types';
import { CreateLiveDto } from './create-live.dto';

export class UpdateLiveDto extends PartialType(CreateLiveDto) {}
