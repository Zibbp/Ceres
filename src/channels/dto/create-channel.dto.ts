import { IsString } from "class-validator";

export class CreateChannelDto {
    @IsString()
    username: string
}
