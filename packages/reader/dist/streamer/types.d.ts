export declare type Archive = {
    filename: string;
    files: {
        dir: boolean;
        name: string;
        blob: () => Promise<Blob>;
        string: () => Promise<string>;
        base64: () => Promise<string>;
        size: number;
    }[];
};
