import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserPasswordDto extends PartialType(CreateUserDto) {
    @IsString()
    @MinLength(6)
    @MaxLength(64)
    old: string

    @IsString()
    @MinLength(6)
    @MaxLength(64)
    new: string

    @IsString()
    @MinLength(6)
    @MaxLength(64)
    confirm: string
}
