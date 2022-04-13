import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configValidationSchema } from './config.schema';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChannelsModule } from './channels/channels.module';
import { VodsModule } from './vods/vods.module';
import { TwitchService } from './twitch/twitch.service';
import { TwitchModule } from './twitch/twitch.module';
import { HttpModule } from '@nestjs/axios';
import { FilesService } from './files/files.service';
import { FilesModule } from './files/files.module';
import { QueuesModule } from './queues/queues.module';
import { ExecService } from './exec/exec.service';
import { ExecModule } from './exec/exec.module';
import { QueuesService } from './queues/queues.service';
import { QueuesRepository } from './queues/queues.repository';
import { VodsRepository } from './vods/vods.repository';
import { ChannelsRepository } from './channels/channels.repository';
import { UsersRepository } from './users/users.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from './metrics/metrics.module';
import { LiveModule } from './live/live.module';
import { LiveRepository } from './live/live.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        `.env.local`,
        `.env`,
      ],
      validationSchema: configValidationSchema,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          autoLoadEntities: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
    }),

    TypeOrmModule.forFeature([
      QueuesRepository,
      VodsRepository,
      ChannelsRepository,
      UsersRepository,
      LiveRepository
    ]),

    AuthModule,

    UsersModule,

    ChannelsModule,

    VodsModule,

    TwitchModule,

    HttpModule,

    CacheModule.register(),

    FilesModule,

    QueuesModule,

    ExecModule,

    ScheduleModule.forRoot(),

    MetricsModule,

    LiveModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TwitchService,
    FilesService,
    ExecService,
    QueuesService,
  ],
})
export class AppModule { }
