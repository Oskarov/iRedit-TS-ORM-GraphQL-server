import {Field, Int, ObjectType} from "type-graphql";
import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@ObjectType()
@Entity()
export class User {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    @CreateDateColumn({type: 'date'})
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field()
    @Column({unique: true})
    username!: string

    @Field()
    @Column({unique: true})
    email!: string

    @Column()
    password!: string


}