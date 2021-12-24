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
import { QueuesRepository } from 'src/queues/queues.repository';
import { CreateQueueDto } from 'src/queues/dto/create-queue.dto';
import { ExecService } from 'src/exec/exec.service';
import { User } from 'src/users/entities/user.entity';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import { Vod } from './entities/vod.entity';

@Injectable()
export class VodsService {
  private logger = new Logger('VodsService');
  constructor(
    @InjectRepository(VodsRepository)
    private vodsRepository: VodsRepository,
    @InjectRepository(ChannelsRepository)
    private channelsRepository: ChannelsRepository,
    @InjectRepository(QueuesRepository)
    private queuesRepository: QueuesRepository,
    private twitchService: TwitchService,
    private filesService: FilesService,
    private channelsService: ChannelsService,
    private execService: ExecService
  ) { }
  async create(createVodDto: CreateVodDto, user: User) {
    const { id } = createVodDto;

    const vodInfo = await this.twitchService.getVodInfo(id)

    const checkVod = await this.vodsRepository.getVodById(id)

    if (checkVod) {
      throw new HttpException('Vod already exists', HttpStatus.CONFLICT);
    }
    this.logger.verbose(`Archiving vod ${id} requested by ${user.username}`);
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

    // Create queue item
    const createQueue: CreateQueueDto = {
      vodId: id,
      title: vodInfo.title,
      liveArchive: false,
      videoDone: false,
      chatDownloadDone: false,
      chatRenderDone: false,
      completed: false
    }
    const queue = await this.queuesRepository.createQueueItem(createQueue, user)

    await this.execService.archiveVideo(vodInfo, "source", safeChannelName, queue.id)
    await this.execService.archiveChat(vodInfo, safeChannelName, queue.id)

    const hms = vodInfo.duration.split('h').join(':').split('m').join(':').split('s')
    const durationSeconds = this.hmsToSeconds(hms[0])

    this.logger.verbose(`Creating vod ${id} entrty in database`)
    // Create vod entry in database
    const vod = await this.vodsRepository.create({
      id: vodInfo.id,
      channel: checkChannel,
      title: vodInfo.title,
      broadcastType: vodInfo.type,
      duration: durationSeconds,
      viewCount: vodInfo.view_count,
      resolution: 'source',
      downloading: true,
      thumbnailPath: `/${safeChannelName}/${id}/${id}_thumbnail.jpg`,
      webThumbnailPath: `/${safeChannelName}/${id}/${id}_web_thumbnail.jpg`,
      videoPath: `/${safeChannelName}/${id}/${id}_video.mp4`,
      chatPath: `/${safeChannelName}/${id}/${id}_chat.json`,
      chatVideoPath: `/${safeChannelName}/${id}/${id}_chat.mp4`,
      vodInfoPath: `/${safeChannelName}/${id}/${id}_info.json`,
      createdAt: vodInfo.created_at
    })
    await this.vodsRepository.save(vod)

    return { vod, queue }
  };



  async paginate(options: IPaginationOptions, channelId: string): Promise<Pagination<Vod>> {
    const queryBuiler = this.vodsRepository.createQueryBuilder('vod')
    if (channelId) {
      queryBuiler.where("vod.channelId = :channelId", { channelId }).orderBy('vod.createdAt', 'DESC')
    } else {
      queryBuiler.select(['vod', 'channel.id', 'channel.login', 'channel.displayName']).leftJoin('vod.channel', 'channel').orderBy('vod.createdAt', 'DESC')
    }
    return paginate<Vod>(queryBuiler, options);
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
  hmsToSeconds(str: string) {
    var p = str.split(':'),
      s = 0, m = 1;

    while (p.length > 0) {
      s += m * parseInt(p.pop(), 10);
      m *= 60;
    }

    return s;
  }
}
