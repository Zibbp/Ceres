import { Test, TestingModule } from '@nestjs/testing';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';

describe('QueuesController', () => {
  let controller: QueuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueuesController],
      providers: [QueuesService],
    }).compile();

    controller = module.get<QueuesController>(QueuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
