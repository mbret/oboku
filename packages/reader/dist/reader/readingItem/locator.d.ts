import { Context } from "../context";
import { ReadingItem } from "../readingItem";
export declare const createLocator: ({ context }: {
    context: Context;
}) => {
    getReadingItemOffsetFromCfi: (cfi: string, readingItem: ReadingItem) => number;
    getReadingItemOffsetFromPageIndex: (pageIndex: number, readingItem: ReadingItem) => number;
    getReadingItemOffsetFromAnchor: (anchor: string, readingItem: ReadingItem) => number;
};
