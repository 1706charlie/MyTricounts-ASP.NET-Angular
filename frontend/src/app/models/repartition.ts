import { Expose } from "class-transformer";

export class Repartition {
    @Expose({ name: "user" })
    userId?: number;
    weight?: number;
}