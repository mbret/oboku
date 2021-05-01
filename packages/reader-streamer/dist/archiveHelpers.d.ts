import { Archive } from './types';
export declare const getArchiveOpfInfo: (archive: Archive) => {
    data: {
        dir: boolean;
        name: string;
        blob: () => Promise<Blob>;
        string: () => Promise<string>;
        base64: () => Promise<string>;
        size: number;
        encodingFormat?: "text/plain" | undefined;
    } | undefined;
    basePath: string | undefined;
};
