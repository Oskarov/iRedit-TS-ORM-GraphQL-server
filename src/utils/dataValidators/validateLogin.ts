import {User} from "../../entities/User";
import {LoginInput} from "../../resolvers/loginInput";
import argon2 from "argon2";

export const validateLogin = async (user: User | undefined, options: LoginInput) => {
    if (!user) {
        return {
            errors: [{
                field: 'usernameOrEmail',
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

    return null
}