import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LiveService } from './live.service';
import { CreateLiveDto } from './dto/create-live.dto';
import { UpdateLiveDto } from './dto/update-live.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/role.decorator';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller({ path: 'live', version: '1' })
export class LiveController {
  constructor(private readonly liveService: LiveService) { }

  @Post()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ARCHIVER, UserRole.ADMIN)
  create(@Body() createLiveDto: CreateLiveDto, @GetUser() user: User) {
    return this.liveService.create(createLiveDto, user);
  }

  @Get()
  findAll() {
    return this.liveService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.liveService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLiveDto: UpdateLiveDto) {
    return this.liveService.update(id, updateLiveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liveService.remove(id);
  }
}
