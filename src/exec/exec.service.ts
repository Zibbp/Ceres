import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as child from 'child_process';
import * as fs from 'fs';
import { Channel } from 'src/channels/entities/channel.entity';
import { FilesService } from 'src/files/files.service';
import { LiveRepository } from 'src/live/live.repository';
import { QueuesService } from 'src/queues/queues.service';
import { VodsRepository } from 'src/vods/vods.repository';

@Injectable()
export class ExecService {
  private logger = new Logger('ExecService');
  constructor(
    private filesService: FilesService,
    private queuesService: QueuesService,
    @InjectRepository(LiveRepository)
    private liveRepository: LiveRepository,
    @InjectRepository(VodsRepository)
    private vodsRepository: VodsRepository
  ) { }

  async archiveVideo(
    vodInfo: object,
    quality: string,
    safeChannelName: string,
    jobId: string,
  ) {
    let downloadVideoChild;
    try {
      this.logger.verbose(`Spawning video downloader for ${vodInfo['id']}`);
      downloadVideoChild = child.spawn('TwitchDownloaderCLI', [
        '-m',
        'VideoDownload',
        '--threads',
        '10',
        '--quality',
        quality,
        '--id',
        vodInfo['id'],
        '-o',
        `/tmp/${vodInfo['id']}_video.mp4`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error spawning video download for vod  ${vodInfo['id']}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error spawning video download for vod  ${vodInfo['id']}`,
      );
    }

    // Create log file stream
    const videoDownloadLog = fs.createWriteStream(
      `/logs/${vodInfo['id']}_video_download.log`,
    );

    process.stdin.pipe(downloadVideoChild.stdin);

    downloadVideoChild.stdout.on('data', (data) => {
      this.logger.verbose(`Video download ${vodInfo['id']} stdout: ${data}`);
      videoDownloadLog.write(data);
    });
    downloadVideoChild.stderr.on('data', (data) => {
      this.logger.verbose(`Video download ${vodInfo['id']} stderr: ${data}`);
      videoDownloadLog.write(data);
    });

    downloadVideoChild.on('error', (error) => {
      this.logger.error(
        `Video download ${vodInfo['id']} exited with error ${error}`,
      );
      throw new InternalServerErrorException(
        `Video download ${vodInfo['id']} failed with error ${error}`,
      );
    });

    downloadVideoChild.on('close', async (code) => {
      this.logger.verbose(
        `Video download ${vodInfo['id']} coded with code ${code}`,
      );
      if (code !== 0) {
        this.logger.error(
          `Video download ${vodInfo['id']} exited with code ${code}`,
        );
        videoDownloadLog.write(
          `Video download ${vodInfo['id']} exited with code ${code}`,
        );
        videoDownloadLog.end();
        throw new InternalServerErrorException(
          `Video download ${vodInfo['id']} failed with code ${code}`,
        );
      }
      videoDownloadLog.write(
        `Video download ${vodInfo['id']} exited with code ${code}`,
      );

      // Move video to final destination
      videoDownloadLog.write(
        `Moving video to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_video.mp4 ...`,
      );
      this.logger.verbose(
        `Moving video to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_video.mp4 ...`,
      );
      await this.filesService.moveFile(
        `/tmp/${vodInfo['id']}_video.mp4`,
        `/mnt/vods/${safeChannelName}/${vodInfo['id']}/`,
      );
      videoDownloadLog.write(
        `Video moved to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_video.mp4`,
      );
      this.logger.verbose(
        `Video moved to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_video.mp4`,
      );

      await this.queuesService.updateProgress(jobId, 'video');

      videoDownloadLog.end();
    });
  }
  async archiveChat(vodInfo: object, safeChannelName: string, jobId: string) {
    let downloadChatChild;
    try {
      this.logger.verbose(`Spawning chat downloader for ${vodInfo['id']}`);
      downloadChatChild = child.spawn('TwitchDownloaderCLI', [
        '-m',
        'ChatDownload',
        '--id',
        vodInfo['id'],
        '--embed-emotes',
        '-o',
        `/tmp/${vodInfo['id']}_chat.json`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error spawning chat download for vod  ${vodInfo['id']}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error spawning chat download for vod  ${vodInfo['id']}`,
      );
    }

    // Create log file stream
    const chatDownloadLog = fs.createWriteStream(
      `/logs/${vodInfo['id']}_chat_download.log`,
    );

    process.stdin.pipe(downloadChatChild.stdin);

    downloadChatChild.stdout.on('data', (data) => {
      this.logger.verbose(`Chat download ${vodInfo['id']} stdout: ${data}`);
      chatDownloadLog.write(data);
    });

    downloadChatChild.on('error', (error) => {
      this.logger.error(
        `Chat download ${vodInfo['id']} exited with error ${error}`,
      );
      throw new InternalServerErrorException(
        `Chat download ${vodInfo['id']} failed with error ${error}`,
      );
    });

    downloadChatChild.on('close', async (code) => {
      this.logger.verbose(
        `Chat download ${vodInfo['id']} coded with code ${code}`,
      );
      if (code !== 0) {
        this.logger.error(
          `Chat download ${vodInfo['id']} exited with code ${code}`,
        );
        chatDownloadLog.write(
          `Chat download ${vodInfo['id']} exited with code ${code}`,
        );
        chatDownloadLog.end();
        throw new InternalServerErrorException(
          `Chat download ${vodInfo['id']} failed with code ${code}`,
        );
      }
      chatDownloadLog.write(
        `Chat download ${vodInfo['id']} exited with code ${code}`,
      );

      await this.queuesService.updateProgress(jobId, 'chatDownload');

      // Spawn chat render before moving chat files
      await this.renderChat(vodInfo, safeChannelName, jobId);

      chatDownloadLog.end();
    });
  }
  async renderChat(vodInfo: object, safeChannelName: string, jobId: string) {
    let renderChatChild;
    try {
      this.logger.verbose(`Spawning chat render for ${vodInfo['id']}`);
      renderChatChild = child.spawn('TwitchDownloaderCLI', [
        '-m',
        'ChatRender',
        '-i',
        `/tmp/${vodInfo['id']}_chat.json`,
        '-h',
        '1440',
        '-w',
        '340',
        '--framerate',
        '30',
        '--font',
        'Inter',
        '--font-size',
        '13',
        '-o',
        `/tmp/${vodInfo['id']}_chat.mp4`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error spawning chat render for vod  ${vodInfo['id']}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error spawning chat render for vod  ${vodInfo['id']}`,
      );
    }

    // Create log file stream
    const chatRenderLog = fs.createWriteStream(
      `/logs/${vodInfo['id']}_chat_render.log`,
    );

    process.stdin.pipe(renderChatChild.stdin);

    renderChatChild.stdout.on('data', (data) => {
      this.logger.verbose(`Chat render ${vodInfo['id']} stdout: ${data}`);
      chatRenderLog.write(data);
    });

    renderChatChild.on('error', (error) => {
      this.logger.error(
        `Chat render ${vodInfo['id']} exited with error ${error}`,
      );
    });

    renderChatChild.on('close', async (code) => {
      this.logger.verbose(
        `Chat render ${vodInfo['id']} coded with code ${code}`,
      );
      if (code !== 0) {
        this.logger.error(
          `Chat render ${vodInfo['id']} exited with code ${code}`,
        );
        chatRenderLog.write(
          `Chat render ${vodInfo['id']} exited with code ${code}`,
        );
        chatRenderLog.end();
        throw new InternalServerErrorException(
          `Chat render ${vodInfo['id']} failed with code ${code}`,
        );
      }
      chatRenderLog.write(
        `Chat render ${vodInfo['id']} exited with code ${code}`,
      );

      // Move chat to final destination
      this.logger.verbose(
        `Moving chat to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_chat.json ...`,
      );
      await this.filesService.moveFile(
        `/tmp/${vodInfo['id']}_chat.json`,
        `/mnt/vods/${safeChannelName}/${vodInfo['id']}/`,
      );
      this.logger.verbose(
        `Chat moved to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_chat.json`,
      );
      // Move chat render to final destination
      this.logger.verbose(
        `Moving chat render to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_chat.mp4 ...`,
      );
      await this.filesService.moveFile(
        `/tmp/${vodInfo['id']}_chat.mp4`,
        `/mnt/vods/${safeChannelName}/${vodInfo['id']}/`,
      );
      this.logger.verbose(
        `Chat render moved to /mnt/vods/${safeChannelName}/${vodInfo['id']}/${vodInfo['id']}_chat.mp4`,
      );

      await this.queuesService.updateProgress(jobId, 'chatRender');

      chatRenderLog.end();
    });
  }

  async archiveLive(streamInfo,
    quality: string,
    safeChannelName: string,
    jobId: string,
    channel: Channel) {
    //?
    //! Archive Live Video
    //?
    let downloadVideoChild;
    try {
      this.logger.verbose(`Spawning Streamlink video downloader for live stream ${streamInfo.id}`);
      downloadVideoChild = child.spawn('streamlink', [
        '--output',
        `/tmp/${streamInfo.id}.ts`,
        '--twitch-low-latency',
        '--twitch-disable-ads',
        '--twitch-disable-hosting',
        `twitch.tv/${streamInfo.user_name}`,
        `${quality}`
      ]);
    } catch (error) {
      this.logger.error(
        `Error spawning Streamlink for live stream ${streamInfo.id}`,
        error,
      );
    }

    // Create log file stream
    const videoDownloadLog = fs.createWriteStream(
      `/logs/${streamInfo.id}_live_video_download.log`,
    );

    process.stdin.pipe(downloadVideoChild.stdin);

    downloadVideoChild.stdout.on('data', (data) => {
      this.logger.verbose(`Streamlink live video download ${streamInfo.id} stdout: ${data}`);
      videoDownloadLog.write(data);
    });
    downloadVideoChild.stderr.on('data', (data) => {
      this.logger.verbose(`Streamlink live video ${streamInfo.id} stderr: ${data}`);
      videoDownloadLog.write(data);
    });

    downloadVideoChild.on('error', (error) => {
      this.logger.error(
        `Streamlink live video ${streamInfo.id} exited with error ${error}`,
      );
      throw new InternalServerErrorException(
        `Streamlink live video ${streamInfo.id} failed with error ${error}`,
      );
    });

    downloadVideoChild.on('close', async (code) => {
      this.logger.verbose(
        `Streamlink live video ${streamInfo.id} exited.`,
      );
      videoDownloadLog.write(
        `Streamlink live video ${streamInfo.id} exited.`,
      );

      // Stream is offline, send kill to chat downloader
      downloadChatChild.kill('SIGINT');

      // Mark live channel as offline and enter last live time
      await this.liveRepository.updateLiveChannelStatus(channel, false);
      await this.liveRepository.updateLiveChannelLastLive(channel, new Date());

      videoDownloadLog.end();

      // Convert .ts to .mp4
      this.ffmpegTsToMp4(`/tmp/${streamInfo.id}.ts`, `/tmp/${streamInfo.id}_video.mp4`, streamInfo.id, safeChannelName, jobId);
    });

    //? 
    // !Archive Live Chat
    //?
    let downloadChatChild;
    this.logger.debug('Chat download requested')
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.logger.debug('Chat download started')
    try {
      this.logger.verbose(`Spawning chat downloader for live stream ${streamInfo.id}`);
      downloadChatChild = child.spawn('chat_downloader', [
        `https://twitch.tv/${streamInfo.user_name}`,
        '--output',
        `/tmp/${streamInfo.id}_live_raw_chat.json`,
        '-q'
      ]);
    } catch (error) {
      this.logger.error(
        `Error spawning chat download for live stream  ${streamInfo.id}}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error spawning chat download for live stream  ${streamInfo.id}}`,
      );
    }

    // Create log file stream
    const chatDownloadLog = fs.createWriteStream(
      `/logs/${streamInfo.id}_live_chat_download.log`,
    );

    chatDownloadLog.write("Live chat downloader started. It it unlikey you will see any further output in this log.\n");

    process.stdin.pipe(downloadChatChild.stdin);

    downloadChatChild.stdout.on('data', (data) => {
      this.logger.verbose(`Live chat download ${streamInfo.id} stdout: ${data}`);
      chatDownloadLog.write(data);
    });

    downloadChatChild.on('error', (error) => {
      this.logger.error(
        `Live stream chat download ${streamInfo.id} exited with error ${error}`,
      );
      throw new InternalServerErrorException(
        `Live stream chat download ${streamInfo.id} failed with error ${error}`,
      );
    });

    downloadChatChild.on('close', async (code) => {
      this.logger.verbose(
        `Live stream chat download ${streamInfo.id} exited.`,
      );
      chatDownloadLog.write(
        `Live stream chat download ${streamInfo.id} exited.`,
      );

      await this.filesService.liveChatParser(`/tmp/${streamInfo.id}_live_raw_chat.json`, streamInfo);

      await this.queuesService.updateProgress(jobId, 'chatDownload');

      this.logger.log(`Executing chat render for live stream ${streamInfo.id}`)
      this.renderLiveChat(streamInfo, safeChannelName, jobId);

      chatDownloadLog.end();
    });
  }
  async ffmpegTsToMp4(inputPath: string, outputPath: string, streamId: string, safeChannelName: string, jobId: string) {
    const ffmpegLog = fs.createWriteStream(
      `/logs/${streamId}_ffmpeg.log`,
    );

    const cmd = 'ffmpeg'
    const args = [
      '-y',
      '-hide_banner',
      '-i', `${inputPath}`,
      '-c:v', 'copy',
      '-c:a', 'copy',
      `${outputPath}`,
    ]
    const ffmpegProcess = child.spawn(cmd, args);

    ffmpegProcess.stdout.on('data', (data) => {
      this.logger.verbose(`ffmpeg ${streamId} stdout: ${data}`);
      ffmpegLog.write(data);
    });
    ffmpegProcess.stderr.on('data', (data) => {
      this.logger.verbose(`ffmpeg ${streamId} stderr: ${data}`);
      ffmpegLog.write(data);
    });


    ffmpegProcess.on('close', async (code) => {
      ffmpegLog.write(`ffmpeg exited with code ${code}`)

      this.logger.verbose(`ffmpeg ${streamId} exited with code ${code}`);

      // Get video duration and update database
      ffmpegLog.write(`Fetching video duration...`)
      const duration = child.execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${outputPath}`);
      const durationInSeconds = parseInt(duration.toString().trim());
      ffmpegLog.write(`Video duration: ${durationInSeconds}`)
      this.vodsRepository.updateVodLength(streamId, durationInSeconds)

      ffmpegLog.write(
        `Moving video to /mnt/vods/${safeChannelName}/${streamId}/${streamId}_video.mp4 ...`,
      );
      this.logger.verbose(
        `Moving video to /mnt/vods/${safeChannelName}/${streamId}/${streamId}_video.mp4 ...`,
      );
      await this.filesService.moveFile(
        `/tmp/${streamId}_video.mp4`,
        `/mnt/vods/${safeChannelName}/${streamId}/`,
      );
      ffmpegLog.write(
        `Video moved to /mnt/vods/${safeChannelName}/${streamId}/${streamId}_video.mp4`,
      );
      this.logger.verbose(
        `Video moved to /mnt/vods/${safeChannelName}/${streamId}/${streamId}_video.mp4`,
      );

      await this.queuesService.updateProgress(jobId, 'video');

      ffmpegLog.write(
        `Deleting Streamlink stream .ts file ...`,
      );
      this.logger.verbose(
        `Deleting Streamlink stream .ts file ...`,
      );
      child.execSync(`rm ${inputPath}`)
      ffmpegLog.end()
    });

  }
  async renderLiveChat(streamInfo, safeChannelName: string, jobId: string) {
    let renderChatChild;
    try {
      this.logger.verbose(`Spawning chat render for live stream ${streamInfo.id}`);
      renderChatChild = child.spawn('TwitchDownloaderCLI', [
        '-m',
        'ChatRender',
        '-i',
        `/tmp/${streamInfo.id}_live_chat.json`,
        '-h',
        '1440',
        '-w',
        '340',
        '--framerate',
        '30',
        '--font',
        'Inter',
        '--font-size',
        '13',
        '-o',
        `/tmp/${streamInfo.id}_chat.mp4`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error spawning chat render for live stream ${streamInfo.id}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error spawning chat render for live stream ${streamInfo.id}`,
      );
    }

    // Create log file stream
    const chatRenderLog = fs.createWriteStream(
      `/logs/${streamInfo.id}_live_chat_render.log`,
    );

    process.stdin.pipe(renderChatChild.stdin);

    renderChatChild.stdout.on('data', (data) => {
      this.logger.verbose(`Live chat render ${streamInfo.id} stdout: ${data}`);
      chatRenderLog.write(data);
    });

    renderChatChild.on('error', (error) => {
      this.logger.error(
        `Live chat render ${streamInfo.id} exited with error ${error}`,
      );
    });

    renderChatChild.on('close', async (code) => {
      this.logger.verbose(
        `Live chat render ${streamInfo.id} coded with code ${code}`,
      );
      if (code !== 0) {
        this.logger.error(
          `Live chat render ${streamInfo.id} exited with code ${code}`,
        );
        chatRenderLog.write(
          `Live chat render ${streamInfo.id} exited with code ${code}`,
        );
        chatRenderLog.end();
        throw new InternalServerErrorException(
          `Live chat render ${streamInfo.id} failed with code ${code}`,
        );
      }
      chatRenderLog.write(
        `Live chat render ${streamInfo.id} exited with code ${code}`,
      );

      // Move chat to final destination
      this.logger.verbose(
        `Moving chat files for stream ${streamInfo.id}`,
      );
      chatRenderLog.write(
        `Moving chat files for stream ${streamInfo.id}`,
      );
      await this.filesService.moveFile(
        `/tmp/${streamInfo.id}_live_chat.json`,
        `/mnt/vods/${safeChannelName}/${streamInfo.id}/`,
      );
      await this.filesService.moveFile(
        `/tmp/${streamInfo.id}_live_raw_chat.json`,
        `/mnt/vods/${safeChannelName}/${streamInfo.id}/`,
      );
      this.logger.verbose(
        `Moved chat files for stream ${streamInfo.id}`,
      );
      chatRenderLog.write(
        `Moved chat files for stream ${streamInfo.id}`,
      );
      // Move chat render to final destination
      this.logger.verbose(
        `Moving chat render for stream ${streamInfo.id}`,
      );
      chatRenderLog.write(
        `Moving chat render for stream ${streamInfo.id}`,
      );
      await this.filesService.moveFile(
        `/tmp/${streamInfo.id}_chat.mp4`,
        `/mnt/vods/${safeChannelName}/${streamInfo.id}/`,
      );
      this.logger.verbose(
        `Moved chat render for stream ${streamInfo.id}`,
      );
      chatRenderLog.write(
        `Moved chat render for stream ${streamInfo.id}`,
      );

      await this.queuesService.updateProgress(jobId, 'chatRender');

      chatRenderLog.end();
    });
  }
}
