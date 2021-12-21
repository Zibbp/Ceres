import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VodsService } from './vods.service';
import { CreateVodDto } from './dto/create-vod.dto';
import { UpdateVodDto } from './dto/update-vod.dto';

@Controller({ path: 'vods', version: '1' })
export class VodsController {
  constructor(private readonly vodsService: VodsService) { }

  @Post()
  create(@Body() createVodDto: CreateVodDto) {
    return this.vodsService.create(createVodDto);
  }

  @Get()
  findAll() {
    return this.vodsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vodsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVodDto: UpdateVodDto) {
    return this.vodsService.update(+id, updateVodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vodsService.remove(+id);
  }
}
