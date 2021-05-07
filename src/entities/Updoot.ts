import {ObjectType, Field} from "type-graphql";
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity, ManyToOne, ManyToMany, PrimaryColumn,
} from "typeorm";
import {User} from "./User";
import {Post} from "./Post";

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {

    @Field()
    @Column({type: "int"})
    value: number;

    @Field()
    @PrimaryColumn()
    userId: number;

    @Field()
    @ManyToMany(() => User, (user) => user.updoots)
    user: User;

    @Field()
    @PrimaryColumn()
    postId!: number;

    @Field()
    @ManyToMany(() => Post, (post) => post.updoots)
    post: Post;

  /*  @Field()
    @Column()
    creatorId!: number;

    @Field()
    @ManyToOne(() => User, (user) => user.posts)
    creator: User;*/





}