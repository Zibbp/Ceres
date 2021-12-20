import { PartialType } from '@nestjs/mapped-types';
import { CreateVodDto } from './create-vod.dto';

export class UpdateVodDto extends PartialType(CreateVodDto) {}
