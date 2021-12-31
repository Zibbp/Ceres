import { Test, TestingModule } from '@nestjs/testing';
import { QueuesService } from './queues.service';

describe('QueuesService', () => {
  let service: QueuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueuesService],
    }).compile();

    service = module.get<QueuesService>(QueuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
