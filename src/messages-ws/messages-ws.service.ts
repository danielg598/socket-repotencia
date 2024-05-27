import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MensajesChat } from 'src/entities/mensajesChat.entity';
import { SalasChat } from 'src/entities/salasChat.entity';
import { SuscriptoresSalasChat } from 'src/entities/suscriptoresSalasChat.entity';
import { userConected } from 'src/entities/userConected.entity';
import { mensajes, salasChat, suscriptor } from 'src/interfaces/interfaces';
import { Repository } from 'typeorm';

@Injectable()
export class MessagesWsService {
    idSala: any;
    constructor(
        @InjectRepository(MensajesChat)
        private mensajesChatRepository: Repository<MensajesChat>,
        @InjectRepository(SalasChat)
        private salasSubcritas: Repository<SalasChat>,
        @InjectRepository(SuscriptoresSalasChat)
        private suscriptoresChats: Repository<SuscriptoresSalasChat>,
        @InjectRepository(userConected)
        private conectedUsers: Repository<userConected>
    ) { }

    async usersConected(data:{userId:string, userName:string, client?:any}){
        const userConected = this.conectedUsers.create(data);
        return await this.conectedUsers.save(userConected);
    }

    async searchClientsConnect(userId:string){
        return await this.conectedUsers.find({
            where:{userId: userId}
        })
    }

    async obtenerSalasSuscritas(id_user: string, salasActuales:string[]):Promise<SuscriptoresSalasChat[]> {
        
        if(salasActuales.length == 0){salasActuales = ['']}
        return await this.suscriptoresChats
        .createQueryBuilder("suscripciones")
        .where('suscripciones.id_user = :id_user',{id_user} )
        .andWhere('suscripciones.id_sala NOT IN (:...salasActuales)',{salasActuales})
        .orderBy('suscripciones.fecha_suscripcion', 'DESC')
        .leftJoinAndSelect("suscripciones.salas", "salas")
        .getMany();
    }

    async obtenerMensajesSala(id_sala: string) {
        return await this.mensajesChatRepository.find({ where: { id_sala: id_sala }, order:{
            fecha_creacion: 'ASC'
        } })
    }
    async consultarInfoSala(id_sala: string) {
        return await this.salasSubcritas.find({ where: { id_sala: id_sala } })
    }

    async createMensaje(mensaje: mensajes): Promise<any> {
        const message = await this.mensajesChatRepository.save(mensaje)

        return message;
    }

    async validarSala(nombre_salas: string[]): Promise<salasChat[]> {
        return await this.salasSubcritas
            .createQueryBuilder('salas')
            .where('salas.nombre_sala IN (:...nombre_salas)', { nombre_salas: nombre_salas })
            .getMany();
    }
    async createGroup(data: { nombre_sala: any, creador: any, fecha_creacion: Date, suscriptores: suscriptor[] }){
        const prueba = await this.salasSubcritas.save(data).then((resultado) => {
            this.idSala = resultado.id_sala
            return resultado;
        });

        if (data.suscriptores.length) {
            const dataSubs = data.suscriptores.map((susc: suscriptor) => ({ ...susc, id_sala: this.idSala }));
            
            return { type: "response", message: await this.createSubscriptor(dataSubs) };
        }

        return { type: "response", message: prueba };
    }

    async createSala(data: { nombre_sala: any, creador: any, fecha_creacion: Date, suscriptores: suscriptor[] }) {
        const salaValidate = await this.validarSala([data.nombre_sala]).then(async res => {
            return !!res.length;
        });
        if (salaValidate) {
            return { type: "warning", message: 'esta sala ya esta creada' };
        }
        const prueba = await this.salasSubcritas.save(data).then((resultado) => {
            this.idSala = resultado.id_sala
            return resultado;
        });

        if (data.suscriptores.length) {
            const dataSubs = data.suscriptores.map((susc: suscriptor) => ({ ...susc, id_sala: this.idSala, id_suscriptor: susc.id_user }));
            return { type: "response", message: await this.createSubscriptor(dataSubs) };
        }


        return { type: "response", message: prueba };
    }

    async createSubscriptor(data: suscriptor[]) {
        return await this.suscriptoresChats.save(data);
    }

     
}