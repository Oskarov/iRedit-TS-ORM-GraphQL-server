import {Redis} from "ioredis";
import {FORGET_PASSWORD_PREFIX} from "../../config";
import {User} from "../../entities/User";


export const validateNewPassword = async (newPassword: string, newPasswordConfirmed: string, token: string, redis: Redis) => {

    if (newPassword.trim().length <= 5) {
        return {
            errors: [
                {
                    field: 'newPassword',
                    message: 'length must be greater then 5 symbols'
                }
            ]
        }
    }

    if (newPassword !== newPasswordConfirmed) {
        return {
            errors: [
                {
                    field: 'newPasswordConfirmed',
                    message: 'passwords must match'
                }
            ]
        }
    }

    const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
    if (!userId) {
        return {
            errors: [
                {
                    field: 'fatalError',
                    message: 'sorry for server error 1'
                }
            ]
        }
    }

    const user = await User.findOne({id: parseInt(userId)});
    if (!user) {
        return {
            errors: [
                {
                    field: 'fatalError',
                    message: 'sorry for server error 2'
                }
            ]
        }
    }


    return null;
}