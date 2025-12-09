import { Expose } from "class-transformer";

export class Operation {
    id?: number;
    title?: string;
    amount?: number;
    @Expose({ name: 'operation_date'})
    operationDate?: string;
    @Expose({ name: 'created_at' })
    createdAt?: string;
    @Expose({ name: 'initiator'})
    initiatorId?: number;
    @Expose({ name: 'tricount_id'})
    tricountId?: number;
}