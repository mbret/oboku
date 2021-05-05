import { Context } from "../context";
import { ReadingItem } from "../readingItem";
import { ReadingItemManager } from "../readingItemManager";
export declare const createLocator: ({ readingItemManager, context }: {
    readingItemManager: ReadingItemManager;
    context: Context;
}) => {
    getReadingOrderViewOffsetFromReadingItemOffset: (readingItemOffset: number, readingItem: ReadingItem) => number;
    getReadingItemOffsetFromReadingOrderViewOffset: (readingOrderViewOffset: number, readingItem: ReadingItem) => number;
    getReadingItemOffsetFromCfi: (cfi: string, readingItem: ReadingItem) => number;
    getReadingItemOffsetFromPageIndex: (pageIndex: number, readingItem: ReadingItem) => number;
    getReadingItemOffsetFromAnchor: (anchor: string, readingItem: ReadingItem) => number;
};
