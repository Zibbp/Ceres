import { IsDate, IsString } from "class-validator";

export class InternalCreateChannelDto {
    @IsString()
    id: string

    @IsString()
    login: string

    @IsString()
    displayName: string

    @IsString()
    description: string

    @IsString()
    profileImagePath: string

    @IsString()
    offlineImagePath: string

    @IsDate()
    channelCreatedAt: Date
}
