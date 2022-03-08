import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ManualCreateChannelDto } from './dto/manual-create-channel.dto';

@Controller({ path: 'channels', version: '1' })
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ARCHIVER, UserRole.ADMIN)
  create(@Body() createChannelDto: CreateChannelDto, @GetUser() user: User) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
  //   return this.channelsService.update(+id, updateChannelDto);
  // }

  @Delete(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.channelsService.remove(id);
  }

  @Post('/manual')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  createManual(
    @Body() manualCreateChannelDto: ManualCreateChannelDto,
    @GetUser() user: User,
  ) {
    return this.channelsService.createManual(manualCreateChannelDto);
  }
}
