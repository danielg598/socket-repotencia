import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { MensajesChat } from "./mensajesChat.entity";

@Entity({name:'archivos_chat'})
export class ArchivosChat{
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({length:11, nullable:false})
    nombre:string;

    @Column({length:50, nullable:false})
    id_mensaje:string;

    @Column({length:20})
    id_user:string;

    @Column({length:200})
    ubicacion:string;

    @OneToOne(() => MensajesChat, mensaje=> mensaje.id, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    @JoinColumn({name:'id_mensaje'})
    mensaje:MensajesChat
}