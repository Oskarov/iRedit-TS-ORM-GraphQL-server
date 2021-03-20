import {MikroORM} from "@mikro-orm/core";
/*import {Post} from "./entities/Post";*/
import "reflect-metadata";
import microConfig from "./orm.config";
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql';
import {PostResolver} from "./resolvers/post";

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    const app = express();
    /*await orm.getMigrator().up();*/
    /* const post = orm.em.create(Post, {title: 'my first post'});
     await orm.em.persistAndFlush(post);*/
    /*
        const posts = await orm.em.find(Post, {});
        console.log(posts);*/
    /*app.get('/', (_,res) => {
        res.send('hello')
    })*/
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver],
            validate: false
        }),
        context: () => ({
            em: orm.em
        })
    });
    apolloServer.applyMiddleware({app})
    app.listen(4321, () => {
        console.log('server started');
    })
};

main().catch((err) => {
    console.log(err);
});

