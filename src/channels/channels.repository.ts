import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Channel } from './entities/channel.entity';
import { EntityRepository, Repository } from 'typeorm';
import { InternalCreateChannelDto } from './dto/internal-create-channel.dto';

@EntityRepository(Channel)
export class ChannelsRepository extends Repository<Channel> {
  private logger = new Logger('ChannelsRepository');
  async getChannelByName(name: string): Promise<Channel> {
    let channel: Channel;
    try {
      channel = await this.findOne({ where: { login: name } });
    } catch (error) {
      throw new NotFoundException();
    }
    return channel;
  }
  async createChannel(
    internalCreateChannel: InternalCreateChannelDto,
  ): Promise<Channel> {
    const {
      id,
      login,
      displayName,
      description,
      profileImagePath,
      offlineImagePath,
      channelCreatedAt,
    } = internalCreateChannel;
    let channel: Channel;
    try {
      channel = this.create({
        id,
        login,
        displayName,
        description,
        profileImagePath,
        offlineImagePath,
        channelCreatedAt,
      });
      await this.save(channel);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return channel;
  }
}
