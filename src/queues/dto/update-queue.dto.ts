import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateQueueDto } from './create-queue.dto';

export class UpdateQueueDto extends PartialType(CreateQueueDto) {
    @IsBoolean()
    @IsOptional()
    liveArchive: boolean;

    @IsBoolean()
    @IsOptional()
    videoDone: boolean;

    @IsBoolean()
    @IsOptional()
    chatDownloadDone: boolean;

    @IsBoolean()
    @IsOptional()
    chatRenderDone: boolean;

    @IsBoolean()
    @IsOptional()
    completed: boolean;
}
