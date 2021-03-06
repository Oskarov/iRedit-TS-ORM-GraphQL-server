import {Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware} from "type-graphql";
import {Post} from "../entities/Post";
import {MyContext} from "../types";
import {isAuth} from "../middleware/isAuth";
import {getConnection} from "typeorm";
/*import {User} from "../entities/User";*/

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

@ObjectType()
class PaginatedPosts {
    @Field(()=>[Post])
    posts: Post[]
    @Field()
    hasMore: Boolean
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post
    ) {
        return root.text.slice(0, 50);
    }

    /*@FieldResolver(() => User)
    creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
        return userLoader.load(post.creatorId);
    }*/

    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null
    ): Promise<PaginatedPosts> {
        // 20 -> 21
        const realLimit = Math.min(50, limit);
        const reaLimitPlusOne = realLimit + 1;

        const replacements: any[] = [reaLimitPlusOne];

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await getConnection().query(
            `
    select p.*,
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
      ) creator
    from post p
    inner join public.user u on u.id = p."creatorId"
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1
    `,
            replacements
        );

        // const qb = getConnection()
        //   .getRepository(Post)
        //   .createQueryBuilder("p")
        //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
        //   .orderBy('p."createdAt"', "DESC")
        //   .take(reaLimitPlusOne);

        // if (cursor) {
        //   qb.where('p."createdAt" < :cursor', {
        //     cursor: new Date(parseInt(cursor)),
        //   });
        // }

        // const posts = await qb.getMany();
        console.log("posts: ", posts);

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === reaLimitPlusOne,
        };
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

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId', () => Int) postId: number,
        @Ctx() {req}: MyContext
    ){
        const {userId} = req.session;
        
    }
}