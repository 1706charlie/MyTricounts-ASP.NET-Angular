import { Expose, Type } from "class-transformer";
import { User } from "./user";
import { Operation } from "./operation";

export class Tricount {
    id?: number;
    title?: string;
    description?: string;
    @Expose({ name: 'created_at' })
    createdAt?: string;
    @Expose({ name: 'creator' })
    creatorId?: number;
    @Type(() => User)
    participants: User[] = [];
    @Type(() => Operation)
    operations: Operation[] = [];

    get creator(): User {
        return this.participants.find(p => p.id == this.creatorId)!;
    }   
}
