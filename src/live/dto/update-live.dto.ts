import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean } from 'class-validator';
import { CreateLiveDto } from './create-live.dto';

export class UpdateLiveDto extends PartialType(CreateLiveDto) {
    @IsBoolean()
    live: boolean
}
