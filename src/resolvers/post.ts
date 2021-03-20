import {Resolver, Query, Ctx} from "type-graphql";
import { Post } from "../entities/Post";
import {MyContext} from "../types";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(
     @Ctx() ctx: MyContext
    ){
        console.log('---------')
        console.log(ctx);
        return ctx.em.find(Post, {});
    }
}