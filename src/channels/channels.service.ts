import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { FilesService } from 'src/files/files.service';
import { TwitchService } from 'src/twitch/twitch.service';
import { ChannelsRepository } from './channels.repository';
import { CreateChannelDto } from './dto/create-channel.dto';
import { InternalCreateChannelDto } from './dto/internal-create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  private logger = new Logger('ChannelsService');
  constructor(
    @InjectRepository(ChannelsRepository)
    private channelsRepository: ChannelsRepository,
    private twitchService: TwitchService,
    private filesService: FilesService
  ) { }

  async create(createChannelDto: CreateChannelDto) {
    const { username } = createChannelDto
    // Fetch channel information from Twitch API
    const channelInfo = await this.twitchService.getChannelInfo(username)
    // Check if channel exists in database
    const checkChannel = await this.channelsRepository.getChannelByName(channelInfo.login)
    if (checkChannel) {
      throw new HttpException('Channel already exists', HttpStatus.CONFLICT)
    }

    const safeChannelName = channelInfo.login.toLowerCase()

    this.logger.verbose(`Creating channel folder ${safeChannelName}`)
    await this.filesService.createFolder(safeChannelName)

    if (channelInfo.profile_image_url) {
      this.logger.verbose(`Downloading profile image for ${username}`)
      await this.filesService.downloadChannelImage(channelInfo.profile_image_url, safeChannelName, `${safeChannelName}_profile.png`)
    }
    if (channelInfo.offline_image_url) {
      this.logger.verbose(`Downloading offline banner image for ${username}`)
      await this.filesService.downloadChannelImage(channelInfo.offline_image_url, safeChannelName, `${safeChannelName}_offline_banner.png`)
    }

    // Create DTO
    const internalCreateChannel: InternalCreateChannelDto = {
      id: channelInfo.id,
      login: channelInfo.login,
      displayName: channelInfo.display_name,
      description: channelInfo.description,
      profileImagePath: `/${safeChannelName}/${safeChannelName}_profile.png`,
      offlineImagePath: `/${safeChannelName}/${safeChannelName}_offline_banner.png`,
      channelCreatedAt: channelInfo.created_at,
    }

    const channel = await this.channelsRepository.createChannel(internalCreateChannel)

    return channel;
  }

  async findAll(): Promise<Array<Channel>> {
    const channels = await this.channelsRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });
    return channels
  }

  async findOne(id: string) {
    let channel: Channel
    try {
      channel = await this.channelsRepository.findOne(id)
      if (!channel) {
        channel = await this.channelsRepository.getChannelByName(id)
      }
    } catch {
      throw new NotFoundException(`Channel "${id}" not found`)
    }
    if (!channel) {
      throw new NotFoundException(`Channel "${id}" not found`)
    }
    return channel
  }

  update(id: number, updateChannelDto: UpdateChannelDto) {
    return `This action updates a #${id} channel`;
  }

  remove(id: number) {
    return `This action removes a #${id} channel`;
  }
}
