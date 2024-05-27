import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({name:'user_conected'})
export class userConected{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type:"varchar", length:20})
    userId:string;

    @Column({type:"varchar", length:20})
    userName:string;

    @Column({type:"json"})
    client:Record<string,any>
}