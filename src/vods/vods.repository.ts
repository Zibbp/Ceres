import { Logger, NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { Vod } from './entities/vod.entity';

@EntityRepository(Vod)
export class VodsRepository extends Repository<Vod> {
  private logger = new Logger('VodsRepository');
  async getVodById(id: string): Promise<Vod> {
    let vod: Vod;
    try {
      vod = await this.findOne({ where: { id }, relations: ['channel'] });
    } catch (error) {
      throw new NotFoundException();
    }
    return vod;
  }
  async updateVodLength(id: string, length: number) {
    try {
      const vod = await this.findOne({ where: { id } });
      vod.duration = length;
      await this.save(vod);
    } catch (error) {
      this.logger.error('Error updating vod duration', error);
    }
  }
}
