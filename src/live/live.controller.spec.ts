import { Test, TestingModule } from '@nestjs/testing';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

describe('LiveController', () => {
  let controller: LiveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveController],
      providers: [LiveService],
    }).compile();

    controller = module.get<LiveController>(LiveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
