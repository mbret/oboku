import { Context } from "./context";
import { Pagination } from "./pagination";
import { ReadingItem } from "./readingItem";
import { ReadingItemManager } from "./readingItemManager";
export declare const createNavigator: ({ readingItemManager, context, pagination, element }: {
    readingItemManager: ReadingItemManager;
    pagination: Pagination;
    context: Context;
    element: HTMLElement;
}) => {
    adjustOffset: (offset: number) => void;
    getCurrentOffset: () => number;
    turnLeft: ({ allowReadingItemChange }?: {
        allowReadingItemChange?: boolean | undefined;
    }) => void;
    turnRight: ({ allowReadingItemChange }?: {
        allowReadingItemChange?: boolean | undefined;
    }) => void;
    goTo: (spineIndexOrIdOrCfi: number | string) => void;
    goToPageOfCurrentChapter: (pageIndex: number) => void;
    adjustPositionForCurrentPagination: () => number | undefined;
    getOffsetInCurrentReadingItem: (readingOrderViewOffset: number, readingItem: ReadingItem) => number;
};
