import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { ManualCreateVodDto } from './dto/manual-create-vod.dto';
import { Live } from 'src/live/entities/live.entity';
import { UsersRepository } from 'src/users/users.repository';

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
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private twitchService: TwitchService,
    private filesService: FilesService,
    private channelsService: ChannelsService,
    private execService: ExecService,
  ) { }
  async create(createVodDto: CreateVodDto, user: User) {
    const { id } = createVodDto;

    const vodInfo = await this.twitchService.getVodInfo(id);

    const checkVod = await this.vodsRepository.getVodById(id);

    if (checkVod) {
      throw new HttpException('Vod already exists', HttpStatus.CONFLICT);
    }

    if (!vodInfo.thumbnail_url) {
      throw new HttpException(
        'Vod thumbnail not found this likely means the channel is still live or the vod has not been processed yet.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.verbose(`Archiving vod ${id} requested by ${user.username}`);
    // Check if vod channel is in database, if not create.
    let checkChannel;
    checkChannel = await this.channelsRepository.getChannelByName(
      vodInfo.user_login,
    );
    if (!checkChannel) {
      this.logger.verbose(
        `Archived vod's channel is not in database. Creating channel ${vodInfo.user_login}`,
      );
      const createChannelDto: CreateChannelDto = {
        username: vodInfo.user_login,
      };
      checkChannel = await this.channelsService.create(createChannelDto);
    }

    const safeChannelName = vodInfo.user_login.toLowerCase();

    // Create vod directory
    this.logger.verbose(`Creating vod ${id} folder`);
    await this.filesService.createFolder(`${safeChannelName}/${id}`);

    // Save vod info to json file
    this.logger.verbose(`Saving vod ${id} info to json file`);
    await this.filesService.writeFile(
      `${safeChannelName}/${id}/${id}_info.json`,
      JSON.stringify(vodInfo),
    );

    // Save vod thumbnail to file
    const thumbnailUrl = vodInfo.thumbnail_url
      .replace('%{width}', '1920')
      .replace('%{height}', '1080');
    const webThumbnailUrl = vodInfo.thumbnail_url
      .replace('%{width}', '640')
      .replace('%{height}', '360');
    this.logger.verbose(`Downloading vod ${id} thumbnail`);
    await this.filesService.downloadVodThumnail(
      thumbnailUrl,
      `${safeChannelName}/${id}/${id}_thumbnail.jpg`,
    );
    this.logger.verbose(`Downloading vod ${id} web thumbnail`);
    await this.filesService.downloadVodThumnail(
      webThumbnailUrl,
      `${safeChannelName}/${id}/${id}_web_thumbnail.jpg`,
    );

    // Create queue item
    const createQueue: CreateQueueDto = {
      vodId: id,
      title: vodInfo.title,
      liveArchive: false,
      videoDone: false,
      chatDownloadDone: false,
      chatRenderDone: false,
      completed: false,
      channelName: checkChannel.displayName
    };
    const queue = await this.queuesRepository.createQueueItem(
      createQueue,
      user,
    );

    await this.execService.archiveVideo(
      vodInfo,
      'source',
      safeChannelName,
      queue.id,
    );
    await this.execService.archiveChat(vodInfo, safeChannelName, queue.id);

    const hms = vodInfo.duration
      .split('h')
      .join(':')
      .split('m')
      .join(':')
      .split('s');
    const durationSeconds = this.hmsToSeconds(hms[0]);

    this.logger.verbose(`Creating vod ${id} entrty in database`);
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
      createdAt: vodInfo.created_at,
    });
    await this.vodsRepository.save(vod);

    return { vod, queue };
  }

  async paginate(
    options: IPaginationOptions,
    channelId: string,
  ): Promise<Pagination<Vod>> {
    const queryBuilder = this.vodsRepository.createQueryBuilder('vod');
    if (queryBuilder) {
      queryBuilder
        .where('vod.channelId = :channelId', { channelId })
        .orderBy('vod.createdAt', 'DESC');
    } else {
      queryBuilder
        .select(['vod', 'channel.id', 'channel.login', 'channel.displayName'])
        .leftJoin('vod.channel', 'channel')
        .orderBy('vod.createdAt', 'DESC');
    }
    return paginate<Vod>(queryBuilder, options);
  }

  async findAllBySearch(
    options: IPaginationOptions,
    search: string
  ): Promise<Pagination<Vod>> {
    try {
      const queryBuilder = this.vodsRepository.createQueryBuilder('vod');

      queryBuilder
        .where('vod.title ILIKE :search', { search: `%${search}%` })
        .orderBy('vod.createdAt', 'DESC');

      return paginate<Vod>(queryBuilder, options);
    } catch (error) {
      this.logger.error('Error searching vods', error);
      throw new InternalServerErrorException('Error searching vods');
    }
  }

  async findAllNoPaginate() {
    try {
      const queryBuilder = await this.vodsRepository.createQueryBuilder('vod');
      queryBuilder
        .select(['vod', 'channel.id', 'channel.login', 'channel.displayName'])
        .orderBy('vod.createdAt', 'DESC')
        .leftJoin('vod.channel', 'channel');
      return await queryBuilder.getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error finding all vods');
    }
  }

  async findOne(id: string) {
    let vod: object;
    try {
      vod = await this.vodsRepository.getVodById(id);
    } catch (error) {
      throw new NotFoundException(`Vod with id ${id} not found`);
    }
    if (!vod) {
      throw new NotFoundException(`Vod with id ${id} not found`);
    }
    return vod;
  }

  async update(id: string, updateVodDto: UpdateVodDto) {
    const vod = await this.vodsRepository.getVodById(id);
    if (!vod) {
      throw new NotFoundException(`Vod with id ${id} not found`);
    }
    vod.title = updateVodDto.title;
    vod.broadcastType = updateVodDto.broadcastType;
    vod.duration = updateVodDto.duration;
    vod.viewCount = updateVodDto.viewCount;
    vod.resolution = updateVodDto.resolution;
    vod.downloading = updateVodDto.downloading;
    vod.thumbnailPath = updateVodDto.thumbnailPath;
    vod.webThumbnailPath = updateVodDto.webThumbnailPath;
    vod.videoPath = updateVodDto.videoPath;
    vod.chatPath = updateVodDto.chatPath;
    vod.chatVideoPath = updateVodDto.chatVideoPath;
    vod.vodInfoPath = updateVodDto.vodInfoPath;
    vod.createdAt = updateVodDto.createdAt;

    try {
      await this.vodsRepository.save(vod);
    } catch (error) {
      throw new InternalServerErrorException('Error updating vod');
    }

    return vod;
  }

  async remove(id: string) {
    const vod = await this.findOne(id);
    const channelName = vod['channel']['login'].toLowerCase();
    const vodPath = `/mnt/vods/${channelName}/${id}`;
    await this.filesService.deleteFolder(vodPath);
    try {
      await this.vodsRepository.delete(vod['id']);
    } catch (error) {
      this.logger.error('Error deleting vod', error);
      throw new InternalServerErrorException('Error deleting vod');
    }
    return;
  }

  async manualCreate(manualCreateVodDto: ManualCreateVodDto, user: User) {
    const checkChannel = await this.channelsRepository.findOne(
      manualCreateVodDto.channel,
    );
    if (!checkChannel) {
      throw new NotFoundException(
        `Channel not found with supplied id ${manualCreateVodDto.channel}`,
      );
    }

    // Check if vod id exists
    const checkVodId = await this.vodsRepository.findOne(manualCreateVodDto.id);
    if (checkVodId) {
      throw new ConflictException(
        `VOD exists with supplied id ${manualCreateVodDto.id}`,
      );
    }

    try {
      const vod = await this.vodsRepository.create({
        id: manualCreateVodDto.id,
        channel: checkChannel,
        title: manualCreateVodDto.title,
        broadcastType: manualCreateVodDto.broadcastType,
        duration: parseInt(manualCreateVodDto.duration),
        viewCount: parseInt(manualCreateVodDto.viewCount),
        resolution: manualCreateVodDto.resolution,
        downloading: false,
        thumbnailPath: manualCreateVodDto.thumbnailPath,
        webThumbnailPath: manualCreateVodDto.webThumbnailPath,
        videoPath: manualCreateVodDto.videoPath,
        chatPath: manualCreateVodDto.chatPath,
        chatVideoPath: manualCreateVodDto.chatVideoPath,
        vodInfoPath: manualCreateVodDto.vodInfoPath,
        createdAt: manualCreateVodDto.createdAt,
      });
      await this.vodsRepository.save(vod);

      return vod;
    } catch (error) {
      this.logger.error('Error manually inserting vod', error);
      throw new InternalServerErrorException(
        'Error manually inserting vod',
        error,
      );
    }
  }

  // Internal
  async createLiveVod(live: Live, stream) {
    const id = stream.id

    const checkVod = await this.vodsRepository.getVodById(id);

    if (checkVod) {
      this.logger.error("Vod already exists with id", id);
    }

    this.logger.log(`Creating VOD item for live channel ${stream.user_name}`);

    // Check if vod channel is in database, if not create.
    let checkChannel;
    checkChannel = await this.channelsRepository.getChannelByName(
      live.channel.login,
    );
    if (!checkChannel) {
      this.logger.error(
        `Live channel not found in database`, live.channel.displayName);
    }

    // Safe channel name for files
    const safeChannelName = live.channel.login.toLowerCase();

    // Create vod directory
    this.logger.verbose(`Creating vod ${id} folder`);
    await this.filesService.createFolder(`${safeChannelName}/${id}`);

    // Save vod info to json file
    this.logger.verbose(`Saving vod ${id} info to json file`);
    await this.filesService.writeFile(
      `${safeChannelName}/${id}/${id}_info.json`,
      JSON.stringify(stream),
    );

    // Save vod thumbnail to file
    const thumbnailUrl = stream.thumbnail_url
      .replace('{width}', '1920')
      .replace('{height}', '1080');
    const webThumbnailUrl = stream.thumbnail_url
      .replace('{width}', '640')
      .replace('{height}', '360');
    this.logger.verbose(`Downloading vod ${id} thumbnail`);
    await this.filesService.downloadVodThumnail(
      thumbnailUrl,
      `${safeChannelName}/${id}/${id}_thumbnail.jpg`,
    );
    this.logger.verbose(`Downloading vod ${id} web thumbnail`);
    await this.filesService.downloadVodThumnail(
      webThumbnailUrl,
      `${safeChannelName}/${id}/${id}_web_thumbnail.jpg`,
    );

    // Create queue item
    const createQueue: CreateQueueDto = {
      vodId: id,
      title: stream.title,
      liveArchive: true,
      videoDone: false,
      chatDownloadDone: false,
      chatRenderDone: false,
      completed: false,
      channelName: checkChannel.displayName
    };
    const queue = await this.queuesRepository.createQueueItem(
      createQueue,
      live.user
    );

    this.execService.archiveLive(
      stream,
      'best',
      safeChannelName,
      queue.id,
      checkChannel
    );
    // await this.execService.archiveChat(vodInfo, safeChannelName, queue.id);

    this.logger.verbose(`Creating vod ${id} entrty in database`);
    // Create vod entry in database
    const vod = await this.vodsRepository.create({
      id: id,
      channel: checkChannel,
      title: stream.title,
      broadcastType: stream.type,
      duration: 1,
      viewCount: 1,
      resolution: 'source',
      downloading: true,
      thumbnailPath: `/${safeChannelName}/${id}/${id}_thumbnail.jpg`,
      webThumbnailPath: `/${safeChannelName}/${id}/${id}_web_thumbnail.jpg`,
      videoPath: `/${safeChannelName}/${id}/${id}_video.mp4`,
      chatPath: `/${safeChannelName}/${id}/${id}_chat.json`,
      chatVideoPath: `/${safeChannelName}/${id}/${id}_chat.mp4`,
      vodInfoPath: `/${safeChannelName}/${id}/${id}_info.json`,
      createdAt: stream.started_at,
    });
    await this.vodsRepository.save(vod);

    return { vod, queue };

  }

  hmsToSeconds(str: string) {
    // eslint-disable-next-line no-var
    var p = str.split(':'),
      s = 0,
      m = 1;

    while (p.length > 0) {
      s += m * parseInt(p.pop(), 10);
      m *= 60;
    }

    return s;
  }
}
