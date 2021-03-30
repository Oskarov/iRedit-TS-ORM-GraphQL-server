import {MikroORM} from "@mikro-orm/core";
/*import {Post} from "./entities/Post";*/
import "reflect-metadata";
import microConfig from "./orm.config";
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql';
import {PostResolver} from "./resolvers/post";
import {UserResolver} from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import {MyContext} from "./types";
import cors from "cors"

const config = require('./config');

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    const app = express();
    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }))
    app.use(
        session({
            name: 'qid',
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
                httpOnly: true,
                secure: config.__prod__,
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
            em: orm.em, req, res
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

