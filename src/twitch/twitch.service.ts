import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TwitchService implements OnModuleInit {
  private logger = new Logger('TwitchService');
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private httpService: HttpService,
    private configService: ConfigService,
  ) { }
  async onModuleInit() {
    await this.authenticate();
  }

  // Authenticate with Twitch every week
  @Cron(CronExpression.EVERY_WEEK)
  handleCron() {
    this.logger.log('Executing weekly Twitch authentication...');
    this.authenticate();
  }

  //   Authenticate with Twitch - returns bearer token
  async authenticate() {
    let response;
    const clientId = this.configService.get('CLIENT_ID');
    const clientSecret = this.configService.get('CLIENT_SECRET');
    try {
      const authenticateReq = this.httpService.post(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      );
      response = await firstValueFrom(authenticateReq);
      //   Store bearer token in cache
      await this.cacheManager.set(
        'twitchBerarerToken',
        response.data.access_token,
        { ttl: 60 * 60 * 24 * 365 },
      );
      this.logger.log(
        'Authenticated with Twitch and stored bearer token in cache.',
      );
    } catch (error) {
      this.logger.error('Error authenticating with Twitch', error);
    }
    return response.data;
  }
  async getChannelInfo(channelName: string) {
    let response;
    try {
      const bearerToken = await this.cacheManager.get('twitchBerarerToken');
      const headers = {
        'Client-ID': this.configService.get('CLIENT_ID'),
        Authorization: `Bearer ${bearerToken}`,
      };
      const request = this.httpService.get(
        `https://api.twitch.tv/helix/users?login=${channelName}&first=1`,
        { headers },
      );
      response = await firstValueFrom(request);
    } catch (error) {
      this.logger.error('Error getting channel info from Twitch', error);
    }
    if (!response.data.data.length) {
      throw new NotFoundException(`Channel ${channelName} not found`);
    }
    return response.data.data[0];
  }
  async getVodInfo(id: string) {
    let response;
    try {
      const bearerToken = await this.cacheManager.get('twitchBerarerToken');
      const headers = {
        'Client-ID': this.configService.get('CLIENT_ID'),
        Authorization: `Bearer ${bearerToken}`,
      };
      const request = this.httpService.get(
        `https://api.twitch.tv/helix/videos?id=${id}&first=1`,
        { headers },
      );
      response = await firstValueFrom(request);
    } catch (error) {
      this.logger.warn(`Error getting vod ${id} info from Twitch`, error);
      throw new NotFoundException();
    }
    if (!response.data.data.length) {
      throw new NotFoundException(`Vod ${id} not found`);
    }
    return response.data.data[0];
  }
  async getLiveInfo(id: string) {
    if (!id) {
      throw new BadRequestException("No channel id provided");
    }
    let response;
    try {
      const bearerToken = await this.cacheManager.get('twitchBerarerToken');
      const headers = {
        'Client-ID': this.configService.get('CLIENT_ID'),
        Authorization: `Bearer ${bearerToken}`,
      };
      const request = this.httpService.get(
        `https://api.twitch.tv/helix/streams?user_id=${id}`,
        { headers },
      );
      response = await firstValueFrom(request);
      return response.data.data[0]
    } catch (error) {
      this.logger.error('Error getting live info from Twitch', error);
      return new InternalServerErrorException('Error getting live info from Twitch')
    }
  }
  // Internal
  async getLiveInfoFromChannelId(queryString: string) {
    let response;
    try {
      const bearerToken = await this.cacheManager.get('twitchBerarerToken');
      const headers = {
        'Client-ID': this.configService.get('CLIENT_ID'),
        Authorization: `Bearer ${bearerToken}`,
      };
      const request = this.httpService.get(
        `https://api.twitch.tv/helix/streams${queryString}`,
        { headers },
      );
      response = await firstValueFrom(request);
      return response.data.data
    } catch (error) {
      this.logger.error('Error getting streams from query string', error);
    }
  }
}
