import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateVodDto } from './create-vod.dto';

export enum BroadcastType {
    ARCHIVE = 'archive',
    LIVE = 'live',
}

export class UpdateVodDto extends PartialType(CreateVodDto) {
    @IsString()
    @IsOptional()
    title: string;

    @IsEnum(BroadcastType)
    @IsOptional()
    broadcastType: BroadcastType

    @IsNumber()
    @IsOptional()
    duration: number;

    @IsNumber()
    @IsOptional()
    viewCount: number;

    @IsString()
    @IsOptional()
    resolution: string;

    @IsBoolean()
    @IsOptional()
    downloading: boolean;

    @IsString()
    @IsOptional()
    thumbnailPath: string;

    @IsString()
    @IsOptional()
    webThumbnailPath: string;

    @IsString()
    @IsOptional()
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
    @IsOptional()
    createdAt: Date;
}
