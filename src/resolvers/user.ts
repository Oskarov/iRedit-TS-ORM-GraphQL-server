import {Arg, Ctx, Field, FieldResolver, Mutation, ObjectType, Query, Resolver, Root} from "type-graphql";
import {MyContext} from "../types";
import {User} from "../entities/User";
import argon2 from "argon2";

import {COOKIE_NAME, FORGET_PASSWORD_PREFIX} from "../config";
import {RegistrationInput} from "./registrationInput";
import {validateRegister} from "../utils/dataValidators/validateRegister";
import {LoginInput} from "./loginInput";
import {FieldError} from "./fieldError";
import {validateLogin} from "../utils/dataValidators/validateLogin";
import {sendEmail} from "../utils/sendEmail";
import {v4} from "uuid";
import {validateNewPassword} from "../utils/dataValidators/validateNewPassword";
import {getConnection} from "typeorm";


@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field(() => User, {nullable: true})
    user?: User
}

@Resolver(User)
export class UserResolver {

    @FieldResolver(()=>String)
    email(@Root() user: User, @Ctx() {req}: MyContext){
        if (req.session.userId === user.id) {
            return user.email;
        }
        return "";
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('newPassword') newPassword: string,
        @Arg('newPasswordConfirmed') newPasswordConfirmed: string,
        @Arg('token') token: string,
        @Ctx() {req, redis}: MyContext
    ) {
        const error = await validateNewPassword(newPassword, newPasswordConfirmed, token, redis);
        const key = FORGET_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);
        if (userId) {
            const userIdNum = parseInt(userId);
            const user = await User.findOne(userIdNum);
            if (user) {
                await User.update({id: userIdNum}, {
                    password: await argon2.hash(newPassword)
                });
                req.session.userId = user.id;
                await redis.del(key);
                return {user};
            }
        }

        return error;
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() {redis}: MyContext
    ) {
        const user = await User.findOne({where: {email}});
        if (!user) {
            return true;
        }
        const token = v4();
        await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3); //3 days
        const emailTemplate = `<a href="http://localhost:3000/change-password/${token}">Change password</a>`;
        await sendEmail(user.email, emailTemplate, 'forgotPassword');
        return true;
    }

    @Query(() => User, {nullable: true})
    me(@Ctx() {req}: MyContext) {
        // you are not logged in
        if (!req.session.userId) {
            return null;
        }

        return User.findOne({id: req.session.userId});
    }


    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: RegistrationInput,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {


        const errors = await validateRegister(options);
        if (errors) {
            return errors;
        }

        const hashedPassword = await argon2.hash(options.password);
        /*const user = em.create(User, {username: options.username, password: hashedPassword});
        await em.persistAndFlush(user);*/

        let user;
        const result = await getConnection().createQueryBuilder().insert().into(User).values(
            {
                username: options.username,
                password: hashedPassword,
                email: options.email,
            }
        ).returning("*").execute();
        user = result.raw[0];
        if (user?.id){
            req.session.userId = user.id;
        }

        return {user};
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: LoginInput,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(options.usernameOrEmail.includes('@')
            ? {where: {email: options.usernameOrEmail}}
            : {where: {username: options.usernameOrEmail}});


        const errors = await validateLogin(user, options);

        if (errors) {
            return errors;
        }

        if (user) {
            req.session.userId = user?.id;
            return {user};
        }

        return {
            errors: [{
                field: 'usernameOrEmail',
                message: 'undefined error',
            }]
        }
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