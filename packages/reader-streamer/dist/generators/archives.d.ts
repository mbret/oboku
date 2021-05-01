import { Archive } from "../types";
export declare const generateArchiveFromTxtContent: (content: string, options?: {
    direction: 'ltr' | 'rtl';
} | undefined) => Promise<Archive>;
