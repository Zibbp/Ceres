import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { VodsService } from './vods.service';
import { CreateVodDto } from './dto/create-vod.dto';
import { UpdateVodDto } from './dto/update-vod.dto';
import { ManualCreateVodDto } from './dto/manual-create-vod.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/role.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { GetUser } from 'src/auth/get-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'vods', version: '1' })
export class VodsController {
  constructor(
    private readonly vodsService: VodsService,
    private configService: ConfigService,
  ) { }

  @Post()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ARCHIVER, UserRole.ADMIN)
  create(@Body() createVodDto: CreateVodDto, @GetUser() user: User) {
    return this.vodsService.create(createVodDto, user);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('channel') channelId: string,
    @Query('search') search: string,
  ) {
    const apiUrl = this.configService.get('API_URL');
    limit = limit > 100 ? 100 : limit;
    if (search) {
      return this.vodsService.findAllBySearch({ page, limit, route: `${apiUrl}/v1/vods` }, search);
    } else {
      return this.vodsService.paginate(
        { page, limit, route: `${apiUrl}/v1/vods` },
        channelId,
      );
    }
  }

  @Get('/all')
  @UseGuards(AuthGuard())
  findAllNoPaginate() {
    return this.vodsService.findAllNoPaginate();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vodsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateVodDto: UpdateVodDto) {
    return this.vodsService.update(id, updateVodDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.vodsService.remove(id);
  }

  @Post('/manual')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ARCHIVER, UserRole.ADMIN)
  manualCreate(
    @Body() manualCreateVodDto: ManualCreateVodDto,
    @GetUser() user: User,
  ) {
    return this.vodsService.manualCreate(manualCreateVodDto, user);
  }
}
