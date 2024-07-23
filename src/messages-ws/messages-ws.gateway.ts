import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io';
import { mensajes, suscriptor } from 'src/interfaces/interfaces';
import { MessagesWsService } from './messages-ws.service';
import { SuscriptoresSalasChat } from 'src/entities/suscriptoresSalasChat.entity';
import { userConected } from 'src/entities/userConected.entity';

@WebSocketGateway({cors:true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect { 
  
  constructor(private readonly messagesWsService: MessagesWsService) { }

  @WebSocketServer() server: Server = new Server();

  handleConnection(client: Socket, user_id: string) {
    console.log('USUARIO CONECTADO ', client.id);
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

    const data = { userId: userId, userName: userName, client: clientData };
    await this.messagesWsService.usersConected(data);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, params: { id_user: string, salasActuales: string[] }) {
    console.log(params.salasActuales,"desde join room ");
    
    let salasSuscritas: suscriptor[] = [];   
    await this.messagesWsService.obtenerSalasSuscritas(params.id_user, params.salasActuales).then(response => {
      salasSuscritas = response;
      

      if(response.length != 0 ){
        
        salasSuscritas.map(async (data) => {
          console.log(data, "data" );
          
          client.join((data.salas.nombre_sala));
          // client.join("salaSuscrita");
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
        console.log(sala, "salllllaaaaaaa");
        

        const principalSubscriber = (res.message as SuscriptoresSalasChat[]).filter((subs: SuscriptoresSalasChat) => (subs.id_user === data.creador));
        await this.verifyConnectedClients(principalSubscriber as SuscriptoresSalasChat[]);

        const otherSubscribers = (res.message as SuscriptoresSalasChat[]).filter((subs: SuscriptoresSalasChat) => (subs.id_user !== data.creador));
        await this.verifyConnectedClients(otherSubscribers as SuscriptoresSalasChat[]);

        // this.server.emit('newSala', sala)
        
        // this.server.emit('salaSuscrita', ...sala);

      }
    });
  }

  // Método para suscribir clientes de usuarios conectados a salas en las que sean agregados
  async verifyConnectedClients(room: (suscriptor & SuscriptoresSalasChat)[]) {
    console.log('LLAMADO A LA VERIFICACIÓN DE CLIENTES ', room);

    let userIds = [];
    let roomId = '';

    room.map((subscriber: SuscriptoresSalasChat) => {
      userIds.push(subscriber.id_user);
      roomId = subscriber.id_sala;
    })

    console.log('USER IDS ', userIds);
    
       
    const connectedClientes = await this.messagesWsService.searchClientsConnected(userIds);
    this.subscribeClientsToRoom(room[0], connectedClientes)
  }

  async subscribeClientsToRoom(room: SuscriptoresSalasChat, clients: userConected[]) {
    console.log('SUBSCRIBIBG CLIENTES ', {room, clients});
    
    clients.map((client: userConected) => {
      console.log('CLIENTE ', client.client.id);
      
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
    const roomSubscribers = await this.messagesWsService.getRoomSubscribers(data.id_sala);
    
    // Se filtra los suscriptores a dicha sala que sean diferentes a quien envía el mensaje
    let subscribersToNotify: string[] = [];
    roomSubscribers.map((subscriber: { id_user: string }) => {
      if(subscriber.id_user !== data.id_user) subscribersToNotify.push(subscriber.id_user);
    });
    console.log('NOTIFICAR A ', subscribersToNotify);
   
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
    client.emit('messagesRead', data);
  }
} 
