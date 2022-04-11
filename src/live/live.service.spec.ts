import { Test, TestingModule } from '@nestjs/testing';
import { LiveService } from './live.service';

describe('LiveService', () => {
  let service: LiveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveService],
    }).compile();

    service = module.get<LiveService>(LiveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
