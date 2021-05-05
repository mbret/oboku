import { Context } from "./context";
import { ReadingItem } from "./readingItem";
export declare type Pagination = ReturnType<typeof createPagination>;
export declare const createPagination: ({ context }: {
    context: Context;
}) => {
    getPageIndex(): number | undefined;
    getNumberOfPages(): number;
    update: (readingItem: ReadingItem, offsetInReadingItem: number, options: {
        isAtEndOfChapter: boolean;
        shouldUpdateCfi: boolean;
    }) => void;
    getCfi(): string | undefined;
    $: import("rxjs").Observable<{
        event: 'change';
    }>;
};
export declare const getItemOffsetFromPageIndex: (pageWidth: number, pageIndex: number, itemWidth: number) => number;
export declare const getNumberOfPages: (itemWidth: number, pageWidth: number) => number;
export declare const getClosestValidOffsetFromApproximateOffsetInPages: (offset: number, pageWidth: number, itemWidth: number) => number;
