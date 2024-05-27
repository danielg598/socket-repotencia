import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesWsGateway } from './messages-ws/messages-ws.gateway';
import { MessagesWsModule } from './messages-ws/messages-ws.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosChat } from './entities/archivosChat.entity';
import { MensajesChat } from './entities/mensajesChat.entity';
import { SalasChat } from './entities/salasChat.entity';
import { SuscriptoresSalasChat } from './entities/suscriptoresSalasChat.entity';
import { userConected } from './entities/userConected.entity';

@Module({
  imports: [
    MessagesWsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'client'), }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'gc',
      entities: [MensajesChat, SuscriptoresSalasChat, SalasChat, ArchivosChat,userConected],
      synchronize: true,
      autoLoadEntities: true,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
