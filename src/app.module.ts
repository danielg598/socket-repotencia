import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesWsGateway } from './messages-ws/messages-ws.gateway';
import { MessagesWsModule } from './messages-ws/messages-ws.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ArchivosChat } from './entities/archivosChat.entity';
import { MensajesChat } from './entities/mensajesChat.entity';
import { SalasChat } from './entities/salasChat.entity';
import { SuscriptoresSalasChat } from './entities/suscriptoresSalasChat.entity';
import { userConected } from './entities/userConected.entity';

@Module({
  imports: [
    MessagesWsModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'client'), }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        Logger.log('Configuring TypeOrmModule...');
        const dbConfig: TypeOrmModuleOptions = {
          type: 'mysql',
          host: process.env.DATABASE_HOST,
          port: parseInt(process.env.DATABASE_PORT),
          username: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          entities: [MensajesChat, SuscriptoresSalasChat, SalasChat, ArchivosChat,userConected],
          synchronize: true,
          autoLoadEntities: true,
        };

        Logger.log(`Database Host: ${dbConfig.host}`);
        Logger.log(`Database Port: ${dbConfig.port}`);
        Logger.log(`Database Username: ${dbConfig.username}`);
        Logger.log(`Database Name: ${dbConfig.database}`);

        console.log('DB Config:', dbConfig);

        if (!dbConfig.host || !dbConfig.port || !dbConfig.username || !dbConfig.password || !dbConfig.database) {
          throw new Error('Missing database configuration');
        }

        return dbConfig;
      },
      inject: [ConfigService]
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
