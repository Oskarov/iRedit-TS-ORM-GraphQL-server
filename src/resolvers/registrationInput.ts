import {Field, InputType} from "type-graphql";

@InputType()
export class RegistrationInput {
    @Field()
    username: string
    @Field()
    email: string
    @Field()
    password: string
}