import { Controller, Get, Query } from '@nestjs/common';
import { TwitchService } from './twitch.service';

@Controller({ path: 'twitch', version: '1' })
export class TwitchController {
  constructor(private readonly twitchService: TwitchService) { }

  @Get('/authenticate')
  async authenticate() {
    return await this.twitchService.authenticate();
  }

  @Get('/channels')
  async channels(@Query('username') username: string) {
    return await this.twitchService.getChannelInfo(username);
  }

  @Get('/vods')
  async vods(@Query('id') id: string) {
    return await this.twitchService.getVodInfo(id);
  }

  @Get('/live')
  async live(@Query('id') id: string) {
    return await this.twitchService.getLiveInfo(id);
  }
}
