import { Context } from "./context";
import { ReadingItem } from "./readingItem";
export declare type Pagination = ReturnType<typeof createPagination>;
export declare const createPagination: ({ context }: {
    context: Context;
}) => {
    getPageIndex(): number | undefined;
    getNumberOfPages(): number;
    getIsAtEndOfChapter(): boolean;
    update: (readingItem: ReadingItem, offsetInReadingItem: number, options?: {
        isAtEndOfChapter?: boolean | undefined;
    }) => void;
    getCfi(): string | undefined;
    getClosestValidOffsetFromOffset: (offsetInReadingItem: number, readingItem: ReadingItem) => number;
    calculateClosestOffsetFromPage: (pageIndex: number, readingItem: ReadingItem) => number;
    $: import("rxjs").Observable<{
        event: 'change';
    }>;
};
