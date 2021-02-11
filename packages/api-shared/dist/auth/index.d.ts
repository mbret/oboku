export declare type Token = {
    userId: string;
    email: string;
};
export declare const createAuthenticator: ({ privateKey }: {
    privateKey: string;
}) => {
    withToken: (authorization?: string | undefined) => Promise<Token>;
};
