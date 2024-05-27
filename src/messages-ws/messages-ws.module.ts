import { Module } from '@nestjs/common';
import { MessagesWsGateway } from './messages-ws.gateway';
import { MessagesWsService } from './messages-ws.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosChat } from 'src/entities/archivosChat.entity';
import { MensajesChat } from 'src/entities/mensajesChat.entity';
import { SalasChat } from 'src/entities/salasChat.entity';
import { SuscriptoresSalasChat } from 'src/entities/suscriptoresSalasChat.entity';
import { userConected } from 'src/entities/userConected.entity';

@Module({
    providers:[MessagesWsGateway, MessagesWsService],
    imports:[TypeOrmModule.forFeature([MensajesChat, SuscriptoresSalasChat, SalasChat, ArchivosChat, userConected])]

})
export class MessagesWsModule {}
