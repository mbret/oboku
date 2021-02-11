declare let secrets: {
    client_id: string;
    client_secret: string;
};
export declare const getSecrets: () => {
    client_id: string;
    client_secret: string;
};
export declare const configure: (options: typeof secrets) => void;
export {};
