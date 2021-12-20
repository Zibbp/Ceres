import { Test, TestingModule } from '@nestjs/testing';
import { VodsController } from './vods.controller';
import { VodsService } from './vods.service';

describe('VodsController', () => {
  let controller: VodsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VodsController],
      providers: [VodsService],
    }).compile();

    controller = module.get<VodsController>(VodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
