import { Expose, Type } from "class-transformer";
import { User } from "./user";
import { Operation } from "./operation";

export class Tricount {
    id?: number;
    title?: string;
    description?: string | null;
    @Expose({ name: 'created_at' })
    createdAt?: string;
    @Expose({ name: 'creator' })
    creatorId?: number;
    @Type(() => User)
    participants: User[] = [];
    @Type(() => Operation)
    operations: Operation[] = [];

    get creatorName(): string {
        const creator = this.participants.find(p => p.id == this.creatorId);
        return creator?.fullName ?? 'Unkown';
    }

    get mutualFriends(): string {
        const nbParticipants = this.participants.length;
        const mutualFriends = Math.max(nbParticipants-1, 0)

        if (mutualFriends === 0) return "you're alone";
        if (mutualFriends === 1) return 'with 1 friend';
        return `with ${mutualFriends} friends`;
    }


}