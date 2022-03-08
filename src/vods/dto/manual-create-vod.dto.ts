import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { CreateVodDto } from './create-vod.dto';

export enum BroadcastType {
    ARCHIVE = 'archive',
    LIVE = 'live',
}

export class ManualCreateVodDto extends PartialType(CreateVodDto) {
    @IsString()
    id: string;

    @IsString()
    channel: string;

    @IsString()
    title: string;

    @IsEnum(BroadcastType)
    broadcastType: BroadcastType;

    @IsString()
    duration: string;

    @IsString()
    viewCount: string;

    @IsString()
    resolution: string;

    @IsBoolean()
    @IsOptional()
    downloading: boolean;

    @IsString()
    thumbnailPath: string;

    @IsString()
    webThumbnailPath: string;

    @IsString()
    videoPath: string;

    @IsString()
    @IsOptional()
    chatPath: string;

    @IsString()
    @IsOptional()
    chatVideoPath: string;

    @IsString()
    @IsOptional()
    vodInfoPath: string;

    @IsString()
    createdAt: Date;
}
