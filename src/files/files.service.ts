import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as fs from 'fs'
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FilesService {
    private logger = new Logger("FilesService");
    constructor(
        private httpService: HttpService
    ) { }
    async createFolder(folderName: string) {
        try {
            if (await !fs.existsSync(`/mnt/vods/${folderName}`)) {
                await fs.mkdirSync(`/mnt/vods/${folderName}`, { recursive: true });
            }
        } catch (error) {
            this.logger.error('Error creating folder', error)
            throw new InternalServerErrorException(`Error creating folder /mnt/vods/${folderName}`);
        }
    }
    async downloadChannelImage(url: string, channel: string, fileName: string) {
        try {
            const imageReq = await this.httpService.get(url, {
                responseType: 'arraybuffer',
            });
            const response = await firstValueFrom(imageReq)

            await fs.writeFileSync(`/mnt/vods/${channel}/${fileName}`, response.data);

        } catch (error) {
            this.logger.error('Error downloading channel image', error)
            throw new InternalServerErrorException(`Error downloading channel image`);
        }
    }
    async writeFile(fileName: string, data: string) {
        try {
            await fs.writeFileSync(`/mnt/vods/${fileName}`, data);
        } catch (error) {
            this.logger.error('Error writing file', error)
            throw new InternalServerErrorException(`Error writing file /mnt/vods/${fileName}`);
        }
    }
}