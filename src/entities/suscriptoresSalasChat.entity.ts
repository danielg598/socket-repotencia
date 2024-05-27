import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { SalasChat } from "./salasChat.entity"

@Entity({name:'suscriptores_salas_chat'})
export class SuscriptoresSalasChat {

    @PrimaryColumn({type:'varchar', length:20})
    id_user: string

    @PrimaryColumn({ type: "uuid", nullable: false })
    id_sala: string

    @Column({ type: "varchar", length: 100 })
    nombre_sala: string

    @Column({ type: "varchar", length: 30 })
    imagen_sala: string

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'fecha_suscripcion' })
    fecha_suscripcion: Date

    @ManyToOne(() => SalasChat, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_sala', referencedColumnName: "id_sala" })
    public salas: SalasChat;

    

}