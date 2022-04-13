import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelsService } from 'src/channels/channels.service';
import { Channel } from 'src/channels/entities/channel.entity';
import { TwitchService } from 'src/twitch/twitch.service';
import { User } from 'src/users/entities/user.entity';
import { VodsService } from 'src/vods/vods.service';
import { CreateLiveDto } from './dto/create-live.dto';
import { UpdateLiveDto } from './dto/update-live.dto';
import { Live } from './entities/live.entity';
import { LiveRepository } from './live.repository';

@Injectable()
export class LiveService {
  private logger = new Logger('LiveService');
  constructor(
    @InjectRepository(LiveRepository)
    private liveRepository: LiveRepository,
    private channelService: ChannelsService,
    private twitchService: TwitchService,
    private vodService: VodsService
  ) { }

  // Check if channels are live (5 minutes)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.verbose('Checking if channels are live');
    await this.cronChannelLiveCheck();
  }

  async create(createLiveDto: CreateLiveDto, user: User) {
    // Find channel via supplied channel name
    const channel = await this.channelService.findOne(createLiveDto.channel);
    if (!channel) {
      this.logger.error('Error finding channel with supplied name', createLiveDto.channel);
      throw new InternalServerErrorException('Error finding channel with supplied name');
    }
    // Add channel to live watch list
    const live = await this.liveRepository.createLiveChannelWatch(channel, user);

    return live;
  }

  async findAll() {
    try {
      const live = this.liveRepository.findAll();
      return live;
    } catch (error) {
      this.logger.error('Error finding all live channels', error);
      return new InternalServerErrorException("Error finding all live channels");
    }
  }

  // Internal
  async findAllNotLive() {
    try {
      return await this.liveRepository.findAllNotLive();
    } catch (error) {
      this.logger.error("Error finding all not live channels", error);
    }
  }

  // Internal
  async updateLiveChannelStatus(channelId: string, status: boolean): Promise<Live> {
    try {
      const channel = await this.channelService.findOne(channelId);
      if (!channel) {
        this.logger.error('Error finding channel with supplied name from Twitch API checking live channels', channelId);
      }
      const live = await this.liveRepository.updateLiveChannelStatus(channel, status);
      return live;
    } catch (error) {
      this.logger.error('Error updating channel status', error);
    }
  }

  // Internal
  async cronChannelLiveCheck() {
    let queryString = ""
    try {
      const notLiveChannels = await this.liveRepository.findAllNotLive();
      if (notLiveChannels.length > 0) {
        for await (const [index, channel] of notLiveChannels.entries()) {
          // Construct query string for twitch service and execute it...
          const channelId = channel.channel.id
          let tempQueryString
          if (index === 0) {
            tempQueryString = `?user_id=${channelId}`
          } else {
            tempQueryString = `&user_id=${channelId}`
          }
          queryString = queryString.concat(tempQueryString)
        }
        // Execute Twitch API call with query string
        const checkStreams = await this.twitchService.getLiveInfoFromChannelId(queryString);
        // checkStreams will be an array of objects with each object being a live channel
        if (checkStreams.length > 0) {
          // channels in this loop are live, set them to live and proceed to archive
          for await (const [index, stream] of checkStreams.entries()) {
            // Update channel in live watch list
            this.logger.log(`Channel ${stream.user_name} is live.`);
            const live = await this.liveRepository.updateLiveChannelStatus(stream.user_id, true);

            // Create VOD item
            await this.vodService.createLiveVod(live, stream)
            // Start video download
            // Start chat download

            // Create queue item

          }
        }
      }

    } catch (error) {
      this.logger.error('Error checking if channels are live', error);
    }
  }
  async findOne(id: string) {
    try {
      const liveChannelEntry = await this.liveRepository.findById(id);
      return liveChannelEntry
    } catch (error) {
      this.logger.error('Error finding live channel', error)
      return new InternalServerErrorException("Error finding live channel");
    }
  }
  async update(id: string, updateLiveDto: UpdateLiveDto) {
    try {
      const updateLiveChannel = await this.liveRepository.updateLiveChannel(id, updateLiveDto);
      return updateLiveChannel
    } catch (error) {
      this.logger.error('Error updating live channel', error);
      return new InternalServerErrorException("Error updating live channel");
    }
  }

  // update(id: number, updateLiveDto: UpdateLiveDto) {
  //   return `This action updates a #${id} live`;
  // }

  async remove(channelId: string) {
    try {
      const channel = await this.channelService.findOne(channelId);
      if (!channel) {
        this.logger.error('Error finding channel with supplied name', channelId);
        throw new InternalServerErrorException('Error finding channel with supplied name');
      }
      await this.liveRepository.removeLiveChannelWatch(channel);
      return "Channel removed from live watch list";
    } catch (error) {
      this.logger.error('Error removing channel', error);
      return new InternalServerErrorException("Error removing channel");
    }
  }
}
