import { Expose } from "class-transformer";

export enum Role {
    BasicUser = 0,
    Admin = 1,
}

export class User {
    id?: number;
    email?: string;
    @Expose({ name: 'full_name' }) // mappe le champ JSON full_name vers fullName
    fullName?: string;
    iban?: string;
    role: Role = Role.BasicUser;
    token?: string;

    get roleAsString(): string {
        return Role[this.role];
    }

}
