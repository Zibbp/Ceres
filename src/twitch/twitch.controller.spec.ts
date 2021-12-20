import { Test, TestingModule } from '@nestjs/testing';
import { TwitchController } from './twitch.controller';

describe('TwitchController', () => {
  let controller: TwitchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwitchController],
    }).compile();

    controller = module.get<TwitchController>(TwitchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
