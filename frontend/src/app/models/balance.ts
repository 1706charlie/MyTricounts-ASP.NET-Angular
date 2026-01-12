import { Expose } from "class-transformer";

export class Balance {
    @Expose({ name: "user" })
    userId?: number;
    paid?: number;
    due?: number;
    balance?: number;
}   