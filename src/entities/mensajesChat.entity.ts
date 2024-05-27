import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { SalasChat } from "./salasChat.entity";
import { SuscriptoresSalasChat } from "./suscriptoresSalasChat.entity";

@Entity({name:'mensajes_chat'})
export class MensajesChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  id_sala: string;

  @Column({ type: "varchar", length: 450, nullable: false })
  message: string;

  @Column({ type: "uuid", nullable: false })
  id_user: string;

  @Column({type:"varchar", length:50})
  userName:string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'fecha_creacion' })
  fecha_creacion: Date;

  @ManyToOne(() => SuscriptoresSalasChat, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'id_user', referencedColumnName: "id_user" })
  public suscrip: SuscriptoresSalasChat;

  @ManyToOne(() => SalasChat, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({name:'id_sala', referencedColumnName:'id_sala'})
  public salas:SalasChat;
}