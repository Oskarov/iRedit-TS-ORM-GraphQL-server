import {MikroORM} from "@mikro-orm/core";
/*import {Post} from "./entities/Post";*/
import "reflect-metadata";
import microConfig from "./orm.config";
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql';
import {PostResolver} from "./resolvers/post";
import {UserResolver} from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import {MyContext} from "./types";
import cors from "cors"
import {__prod__, COOKIE_NAME} from  "./config";
import {createConnection} from "typeorm"

const main = async () => {
    const connection = await createConnection({
        type: 'postgres',
        database: 'lireddit2',
        username: 'postgres',
        password: 'root',
        logging: true,
        synchronize: true,
    });
    const orm = await MikroORM.init(microConfig);
    const app = express();
    const RedisStore = connectRedis(session);
    const redis = new Redis();
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }))
    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
                httpOnly: true,
                secure: __prod__,
                sameSite: 'lax'
            },
            saveUninitialized: false,
            secret: 'adfasdafasdfdafAFsASFF',
            resave: false,
        })
    )

    await orm.getMigrator().up();
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}): MyContext => ({
            em: orm.em, req, res, redis
        })
    });
    apolloServer.applyMiddleware({app, cors: {origin: false}})
    app.listen(4321, () => {
        console.log('server started');
    })
};

main().catch((err) => {
    console.log(err);
});

