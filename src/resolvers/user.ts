import {Resolver, Ctx, Mutation, Arg, InputType, Field} from "type-graphql";
import {MyContext} from "../types";
import {User} from "../entities/User";

@InputType
class RegistrationInput {
    @Field()
    username: string
    @Field()
    password: string
}

@Resolver()
export class UserResolver {
    @Mutation(() => [User])
    async register(
        @Arg('options') options: RegistrationInput,
        @Ctx() ctx: MyContext
    ): Promise<User> {
        const user = ctx.em.create(User, {username: options.username, password: options.password});
        await ctx.em.persistAndFlush(user);
        return user;
    }

}