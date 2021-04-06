import {emailIsValid} from "../emailIsValid";
import {User} from "../../entities/User";
import {MyContext} from "../../types";
import {RegistrationInput} from "../../resolvers/registrationInput";

export const validateRegister = async (options: RegistrationInput, mContext: MyContext) => {
    if (!emailIsValid(options.email)) {
        return {
            errors: [
                {
                    field: 'email',
                    message: 'not valid'
                }
            ]
        }
    }

    if (options.email.trim().length <= 2) {
        return {
            errors: [
                {
                    field: 'email',
                    message: 'length must be greater then 2 symbols'
                }
            ]
        }
    }

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
    const existUser = await mContext.em.findOne(User, {username: options.username});
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

    return null;
}