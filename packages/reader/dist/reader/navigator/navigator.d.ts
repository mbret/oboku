import { Context } from "../context";
import { Pagination } from "../pagination";
import { ReadingItemManager } from "../readingItemManager";
export declare const createNavigator: ({ readingItemManager, context, pagination, element }: {
    readingItemManager: ReadingItemManager;
    pagination: Pagination;
    context: Context;
    element: HTMLElement;
}) => {
    adjustOffset: (offset: number) => void;
    getCurrentOffset: () => number;
    turnLeft: (args_0?: {
        allowReadingItemChange?: boolean | undefined;
    } | undefined) => void;
    turnRight: (args_0?: {
        allowReadingItemChange?: boolean | undefined;
    } | undefined) => void;
    goTo: (spineIndexOrSpineItemIdOrPathCfi: number | string | URL) => void;
    goToPageOfCurrentChapter: (pageIndex: number) => void;
    adjustReadingOffsetPosition: ({ shouldAdjustCfi }: {
        shouldAdjustCfi: boolean;
    }) => void;
};
