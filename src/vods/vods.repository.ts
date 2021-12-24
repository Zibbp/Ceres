import { Logger, NotFoundException } from "@nestjs/common";
import { EntityRepository, Repository } from "typeorm";
import { Vod } from "./entities/vod.entity";

@EntityRepository(Vod)
export class VodsRepository extends Repository<Vod> {
    private logger = new Logger("VodsRepository");
    async getVodById(id: string): Promise<Vod> {
        let vod: Vod;
        try {
            vod = await this.findOne({ where: { id }, relations: ["channel"] });
        } catch (error) {
            throw new NotFoundException();
        }

        return vod;
    }
}