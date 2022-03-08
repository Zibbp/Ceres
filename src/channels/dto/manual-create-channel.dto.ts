import { IsDate, IsString } from 'class-validator';

export class ManualCreateChannelDto {
    @IsString()
    id: string;

    @IsString()
    login: string;

    @IsString()
    displayName: string;

    @IsString()
    profileImagePath: string;
}
