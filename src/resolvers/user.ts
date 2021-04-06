import {Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver} from "type-graphql";
import {MyContext} from "../types";
import {User} from "../entities/User";
import argon2 from "argon2";
import {EntityManager} from "@mikro-orm/postgresql"
import {COOKIE_NAME} from "../config";
import {RegistrationInput} from "./registrationInput";
import {validateRegister} from "../utils/dataValidators/validateRegister";
import {LoginInput} from "./loginInput";

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
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() {em}: MyContext
    ) {
        const user = await em.findOne(User, {email});
        console.log(user)
        return true;
    }


    @Query(() => User, {nullable: true})
    me(@Ctx() {em, req}: MyContext) {
        // you are not logged in
        if (!req.session.userId) {
            return null;
        }

        return em.findOne(User, {id: req.session.userId});
    }


    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: RegistrationInput,
        @Ctx() mCon: MyContext
    ): Promise<UserResponse> {

        await validateRegister(options, mCon);

        const hashedPassword = await argon2.hash(options.password);
        /*const user = em.create(User, {username: options.username, password: hashedPassword});
        await em.persistAndFlush(user);*/

        let user;
        const result = await (mCon.em as EntityManager).createQueryBuilder(User).getKnexQuery().insert(
            {
                username: options.username,
                password: hashedPassword,
                email: options.email,
                created_at: new Date(),
                updated_at: new Date()
            }
        ).returning("*");
        user = result[0];

        mCon.req.session.userId = user.id;

        return {user};
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: LoginInput,
        @Ctx() {em, req}: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, options.usernameOrEmail.includes('@')
            ? {email: options.usernameOrEmail}
            : {username: options.usernameOrEmail});
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

    @Mutation(() => Boolean)
    logout(
        @Ctx() {req, res}: MyContext
    ) {

        return new Promise(_res => req.session.destroy(err => {
            if (err) {
                console.log(err);
                _res(false);
                return;
            }
            res.clearCookie(COOKIE_NAME);
            _res(true);
        }));
    }
}