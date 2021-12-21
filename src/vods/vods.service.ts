import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TwitchService } from 'src/twitch/twitch.service';
import { CreateVodDto } from './dto/create-vod.dto';
import { UpdateVodDto } from './dto/update-vod.dto';
import { VodsRepository } from './vods.repository';
import { FilesService } from 'src/files/files.service';
import { ChannelsRepository } from 'src/channels/channels.repository';
import { CreateChannelDto } from 'src/channels/dto/create-channel.dto';
import { ChannelsService } from 'src/channels/channels.service';

@Injectable()
export class VodsService {
  private logger = new Logger('VodsService');
  constructor(
    @InjectRepository(VodsRepository)
    private vodsRepository: VodsRepository,
    @InjectRepository(ChannelsRepository)
    private channelsRepository: ChannelsRepository,
    private twitchService: TwitchService,
    private filesService: FilesService,
    private channelsService: ChannelsService
  ) { }
  async create(createVodDto: CreateVodDto) {
    const { id } = createVodDto;
    console.log(`archiving vods with id: ${id}`);

    const vodInfo = await this.twitchService.getVodInfo(id)

    const checkVod = await this.vodsRepository.getVodById(id)

    if (checkVod) {
      throw new HttpException('Vod already exists', HttpStatus.CONFLICT);
    }

    // Check if vod channel is in database, if not create.
    const checkChannel = await this.channelsRepository.getChannelByName(vodInfo.user_login)
    if (!checkChannel) {
      this.logger.verbose(`Archived vod's channel is not in database. Creating channel ${vodInfo.user_login}`)
      const createChannelDto: CreateChannelDto = { username: vodInfo.user_login }
      const channel = await this.channelsService.create(createChannelDto)
    }

    const safeChannelName = vodInfo.user_login.toLowerCase()

    // Create vod directory
    this.logger.verbose(`Creating vod ${id} folder`)
    await this.filesService.createFolder(`${safeChannelName}/${id}`)

    // Save vod info to json file
    this.logger.verbose(`Saving vod ${id} info to json file`)
    await this.filesService.writeFile(`${safeChannelName}/${id}/${id}_info.json`, JSON.stringify(vodInfo))

    // Save vod thumbnail to file
    const thumbnailUrl = vodInfo.thumbnail_url.replace('%{width}', '1920').replace('%{height}', '1080')
    const webThumbnailUrl = vodInfo.thumbnail_url.replace('%{width}', '640').replace('%{height}', '360')
    this.logger.verbose(`Downloading vod ${id} thumbnail`)
    await this.filesService.downloadVodThumnail(thumbnailUrl, `${safeChannelName}/${id}/${id}_thumbnail.jpg`)
    this.logger.verbose(`Downloading vod ${id} web thumbnail`)
    await this.filesService.downloadVodThumnail(webThumbnailUrl, `${safeChannelName}/${id}/${id}_web_thumbnail.jpg`)



    return vodInfo;

  }

  findAll() {
    return `This action returns all vods`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vod`;
  }

  update(id: number, updateVodDto: UpdateVodDto) {
    return `This action updates a #${id} vod`;
  }

  remove(id: number) {
    return `This action removes a #${id} vod`;
  }
}
