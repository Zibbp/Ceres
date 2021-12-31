import { IsString } from 'class-validator';

export class CreateVodDto {
  @IsString()
  id: string;
}
