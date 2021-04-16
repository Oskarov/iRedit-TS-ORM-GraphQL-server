import {emailIsValid} from "../emailIsValid";
import {User} from "../../entities/User";
import {RegistrationInput} from "../../resolvers/registrationInput";

export const validateRegister = async (options: RegistrationInput) => {
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
    const existUser = await User.findOne({username: options.username});
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