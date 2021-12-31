import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as child from 'child_process';
import * as fs from 'fs';
import { FilesService } from 'src/files/files.service';
import { QueuesService } from 'src/queues/queues.service';

@Injectable()
export class ExecService {
  private logger = new Logger('ExecService');
  constructor(
    private filesService: FilesService,
    private queuesService: QueuesService,
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
}
