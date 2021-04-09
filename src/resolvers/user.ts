import {Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver} from "type-graphql";
import {MyContext} from "../types";
import {User} from "../entities/User";
import argon2 from "argon2";
import {EntityManager} from "@mikro-orm/postgresql"
import {COOKIE_NAME, FORGET_PASSWORD_PREFIX} from "../config";
import {RegistrationInput} from "./registrationInput";
import {validateRegister} from "../utils/dataValidators/validateRegister";
import {LoginInput} from "./loginInput";
import {FieldError} from "./fieldError";
import {validateLogin} from "../utils/dataValidators/validateLogin";
import {sendEmail} from "../utils/sendEmail";
import {v4} from "uuid";
import {validateNewPassword} from "../utils/dataValidators/validateNewPassword";


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
    async changePassword(
        @Arg('newPassword') newPassword: string,
        @Arg('password') newPasswordConfirmed: string,
        @Arg('token') token: string,
        @Ctx() {req, redis, em}: MyContext
    ) {
        await validateNewPassword(newPassword, newPasswordConfirmed, token, em, redis);

        const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
        if (userId) {
            const user = await em.findOne(User, {id: parseInt(userId)});
            if (user) {
                const hashedPassword = await argon2.hash(newPassword);
                user.password = hashedPassword;
                await em.persistAndFlush;
                req.session.userId = user.id;
                return user;
            }
        }

        return false;
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() {em, redis}: MyContext
    ) {
        const user = await em.findOne(User, {email});
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


        const errors = await validateRegister(options, mCon);
        if (errors) {
            return errors;
        }

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