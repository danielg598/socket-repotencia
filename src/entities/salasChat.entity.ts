import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({name:'salas_chat'})
export class SalasChat {

    @PrimaryGeneratedColumn('uuid')
    id_sala: string

    @Column({ length: 100, unique:true })
    nombre_sala: string

    @Column({ length: 20 })
    creador: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'fecha_creacion' })
    fecha_creacion: Date;
}