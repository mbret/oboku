import { Context } from "../context";
import { ReadingItem } from "../readingItem";
import { ReadingItemManager } from "../readingItemManager";
export declare const createLocator: ({ readingItemManager, context }: {
    readingItemManager: ReadingItemManager;
    context: Context;
}) => {
    getReadingOrderViewOffsetFromReadingItemOffset: (readingItemOffset: number, readingItem: ReadingItem) => number;
    getReadingItemOffsetFromReadingOrderViewOffset: (readingOrderViewOffset: number, readingItem: ReadingItem) => number;
};
