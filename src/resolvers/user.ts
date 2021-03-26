import {Resolver, Ctx, Mutation, Arg, InputType, Field, ObjectType} from "type-graphql";
import {MyContext} from "../types";
import {User} from "../entities/User";
import argon2 from 'argon2';

@InputType()
class RegistrationInput {
    @Field()
    username: string
    @Field()
    password: string
}

@InputType()
class LoginInput {
    @Field()
    username: string
    @Field()
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}


@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field(() => User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: RegistrationInput,
        @Ctx() ctx: MyContext
    ): Promise<UserResponse> {
        if (options.username.trim().length <= 2) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'length must be greater then 2 symbols'
                    }
                ]
            }
        }

        if (options.password.trim().length <= 5) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'length must be greater then 5 symbols'
                    }
                ]
            }
        }
        const existUser = await ctx.em.findOne(User, {username: options.username});
        if (existUser) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'username already tekken'
                    }
                ]
            }
        }

        const hashedPassword = await argon2.hash(options.password);
        const user = ctx.em.create(User, {username: options.username, password: hashedPassword});
        await ctx.em.persistAndFlush(user);
        return {user};
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: LoginInput,
        @Ctx() {em, req}: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, {username: options.username});
        if (!user) {
            return {
                errors: [{
                    field: 'username',
                    message: 'could not find this user'
                }]
            }
        }

        const valid = await argon2.verify(user.password, options.password);
        if (!valid) {
            return {
                errors: [{
                    field: 'password',
                    message: 'Username or password incorrect'
                }]
            }
        }

        req.session.userId = user.id;

        return {user};
    }

}