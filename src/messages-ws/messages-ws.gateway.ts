import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io';
import { mensajes, suscriptor } from 'src/interfaces/interfaces';
import { MessagesWsService } from './messages-ws.service';
import { SuscriptoresSalasChat } from 'src/entities/suscriptoresSalasChat.entity';
import { userConected } from 'src/entities/userConected.entity';
import path from 'path';
import fs from 'fs';
import { UtilitiesFunctions } from 'src/utiliies/utilities-functions';

@WebSocketGateway({cors:true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect { 
  
  constructor(private readonly messagesWsService: MessagesWsService) { }

  @WebSocketServer() server: Server = new Server();

  handleConnection(client: Socket, user_id: string) {
    console.log('USUARIO CONECTADO ', { cliend_id: client.id, user_id });
  }

  async handleDisconnect(client: Socket) {
    try {      
      const removed = await this.messagesWsService.removeClientConnected(client.id);
      console.log('EL CLIENTE FUE REMOVIDO DE LA LISTA ', removed);
      
    } catch (error) {
      console.log('NO FUE POSIBLE ELIMINAR EL CLIENTE DESCONECTADO DE LA LISTA ', error);      
    }
  }

  @SubscribeMessage('userConected')
  async userConect(
    @MessageBody('userId') userId: string,
    @MessageBody('userName') userName: string,
    @ConnectedSocket() client: Socket
  ) {
    let clientData = {
      id: client.id,
      handshake: client.handshake,
      rooms: Array.from(client.rooms),
      connected: client.connected,
      join: client.join('')
    };
    console.log('EVENTO USER CONNECTED ', client.id);
    const data = { userId: userId, userName: userName, client: clientData };
    await this.messagesWsService.usersConected(data);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, params: { id_user: string, salasActuales: string[] }) {    
    let salasSuscritas: suscriptor[] = [];   
    await this.messagesWsService.obtenerSalasSuscritas(params.id_user, params.salasActuales).then(response => {
      salasSuscritas = response;      

      if(response.length != 0 ){        
        salasSuscritas.map(async (data) => {
          console.log(data, "data" );
          
          client.join((data.salas.nombre_sala));
          data.mensajes = [];
          // await this.messagesWsService.createSala(data)
          console.log('INFO SUBSCRIPTION ', `Se ha unnido el cliente ${client.id}  a la sala ${data.nombre_sala}`);          
        })  
        client.emit('joinedRooms', salasSuscritas);
      }
    })
  }

  @SubscribeMessage('joinMessages')
  async handleJoinMensajesSalas(client: Socket, id_sala: string) {
    setTimeout(async () => {
      await this.messagesWsService.obtenerMensajesSala(id_sala).then(respuesta => {
        this.server.emit('mensajesSala', respuesta);        
      })
    }, 100);
  }

  @SubscribeMessage('createGroup')
  async handleCreateGroup(client: Socket, data: { nombre_sala: string, creador: string, fecha_creacion: Date, suscriptores: suscriptor[] }){
    await this.messagesWsService.createGroup(data).then(res=>{
      client.emit('grupoSuscrito', res);
      client.emit('newSala', res);
    })
  }

  @SubscribeMessage('createRoom')
  async handleCreateSala(client: Socket, data: { nombre_sala: string, creador: string, fecha_creacion: Date, suscriptores: suscriptor[] }) {
    await this.messagesWsService.createSala(data).then(async res => {
      if (res.type === "warning") {
        client.emit('advertencia', res.message)
      } else {
        // let sala2 = res.message;
        let sala = (res.message as SuscriptoresSalasChat[]).filter((subs: SuscriptoresSalasChat) => (subs.id_user === data.creador));        

        const principalSubscriber = (res.message as SuscriptoresSalasChat[]).filter((subs: SuscriptoresSalasChat) => (subs.id_user === data.creador));
        await this.verifyConnectedClients(principalSubscriber as SuscriptoresSalasChat[]);

        const otherSubscribers = (res.message as SuscriptoresSalasChat[]).filter((subs: SuscriptoresSalasChat) => (subs.id_user !== data.creador));
        await this.verifyConnectedClients(otherSubscribers as SuscriptoresSalasChat[]);
      }
    });
  }

  // Método para suscribir clientes de usuarios conectados a salas en las que sean agregados
  async verifyConnectedClients(room: (suscriptor & SuscriptoresSalasChat)[]) {
    let userIds = [];
    let roomId = '';

    room.map((subscriber: SuscriptoresSalasChat) => {
      userIds.push(subscriber.id_user);
      roomId = subscriber.id_sala;
    })    
       
    const connectedClientes = await this.messagesWsService.searchClientsConnected(userIds);
    this.subscribeClientsToRoom(room[0], connectedClientes)
  }

  async subscribeClientsToRoom(room: SuscriptoresSalasChat, clients: userConected[]) {    
    clients.map((client: userConected) => {      
      const notifyClient = this.server.sockets.sockets.get(client.client.id);
      notifyClient.join(room.id_sala);
      notifyClient.emit('newSala', room)
      notifyClient.emit('salaSuscrita', room)
    });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, data: mensajes) {   
    
    const message = await this.messagesWsService.createMensaje(data);
    await this.messagesWsService.updateMessagesToRead(data.id_sala, data.id_user);

    // Se consultan los diferentes clientes desde los cuales etá conectado el usuario que envía el mensaje y se le emite el vento para que el mensaje sea agregado en las vistas
    const userClients = await this.messagesWsService.searchClientsConnected([data.id_user]);
    userClients.map((client: userConected) => {
      this.emitEventToClient(client, 'sentMessage', message);
    })

    const roomSubscribers = await this.messagesWsService.getRoomSubscribers(data.id_sala);
    
    // Se filtra los suscriptores a dicha sala que sean diferentes a quien envía el mensaje
    let subscribersToNotify: string[] = [];
    roomSubscribers.map((subscriber: { id_user: string }) => {
      if(subscriber.id_user !== data.id_user) subscribersToNotify.push(subscriber.id_user);
    });
   
    // Se consultan los diferentes clientes desde los cuales etá conectado cada suscriptor
    const notifyToClients = await this.messagesWsService.searchClientsConnected(subscribersToNotify);
    notifyToClients.map((client: userConected) => {
      this.emitEventToClient(client, 'newMessage', message);
    })
  }
  
  async emitEventToClient(client: userConected, event: string, data: any) {
    const notifyClient = this.server.sockets.sockets.get(client.client.id);
    notifyClient.emit(event, data)
  }

  @SubscribeMessage('setMessagesAsRead')
  async handleSetMessagesAsRead(client: Socket, data: { id_sala: string, id_user: string }) {
    const updated = await this.messagesWsService.updateMessagesAsRead(data.id_sala, data.id_user);
    // Se consultan los diferentes clientes desde los cuales etá conectado cada suscriptor
    const notifyToClients = await this.messagesWsService.searchClientsConnected([data.id_user]);
    notifyToClients.map((client: userConected) => {
      this.emitEventToClient(client, 'messagesRead', data);
    })
  }

  @SubscribeMessage('uploadFile')
  async handleUploadFile(@MessageBody() client: Socket, data: { file: ArrayBuffer, fileName: string }): Promise<void> {
    const buffer = Buffer.from(data.file);
    const uniqueFileName = UtilitiesFunctions.generateHexString(12);
    const uploadFile = path.join(__dirname, '..', 'public', 'uploads', `${data.fileName}_${uniqueFileName}`);

    try {
      fs.writeFileSync(uploadFile, buffer);
      client.emit('uploasSuccess', { fileName: data.fileName });
    } catch (error) {
      console.log('Sucedió un error al cargar el archivo ', error);      
    }
  }
} 
