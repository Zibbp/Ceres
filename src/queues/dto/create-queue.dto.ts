import { IsString, IsBoolean } from 'class-validator';

export class CreateQueueDto {
  @IsString()
  vodId: string;
  @IsString()
  title: string;
  @IsBoolean()
  liveArchive: boolean;
  @IsBoolean()
  videoDone: boolean;
  @IsBoolean()
  chatDownloadDone: boolean;
  @IsBoolean()
  chatRenderDone: boolean;
  @IsBoolean()
  completed: boolean;
}
