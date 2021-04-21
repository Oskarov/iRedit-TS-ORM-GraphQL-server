import {Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware} from "type-graphql";
import {Post} from "../entities/Post";
import {MyContext} from "../types";
import {isAuth} from "../middleware/isAuth";
import {getConnection} from "typeorm";

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    async posts(
        @Arg('limit') limit: number,
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null
    ): Promise<Post[]> {
        return getConnection()
            .getRepository(Post)
            .createQueryBuilder("p")
            /*.where("user.id = :id", {id: 1})*/
            .orderBy('"createdAt"')
            .getMany();
        return Post.find();
    }

    @Query(() => Post, {nullable: true})
    post(
        @Arg('id', () => Int) id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg('input') input: PostInput,
        @Ctx() {req}: MyContext
    ): Promise<Post> {
        return Post.create({...input, creatorId: req.session.userId}).save();
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, {nullable: true}) title: string
    ): Promise<Post | null> {
        const post = await Post.findOne(id);
        if (!post) {
            return null;
        }
        if (typeof title != "undefined") {
            await Post.update({id}, {title});
        }

        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id') id: number
    ): Promise<boolean> {
        try {
            await Post.delete(id);
        } catch (err) {
            console.log(err);
            return false;
        }

        return true;
    }

}