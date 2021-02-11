import nano from "nano";
interface iUser extends nano.MaybeDocument {
    email: string;
    password: string;
    contentPassword: string | null;
    roles: string[];
    type: 'user';
    name: string;
}
export declare class User implements iUser {
    _id: string;
    email: string;
    password: string;
    contentPassword: string;
    _rev: string | undefined;
    roles: string[];
    type: "user";
    name: string;
    constructor(_id: string, email: string, password: string, contentPassword: string);
    processAPIResponse(response: nano.DocumentInsertResponse): void;
}
export {};
