import { Test, TestingModule } from '@nestjs/testing';
import { VodsService } from './vods.service';

describe('VodsService', () => {
  let service: VodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VodsService],
    }).compile();

    service = module.get<VodsService>(VodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
