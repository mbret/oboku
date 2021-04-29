import { Manifest } from "./types";
export declare type Reader = ReturnType<typeof createReader>;
export declare const createReader: ({ containerElement }: {
    containerElement: HTMLElement;
}) => {
    turnLeft: () => void | undefined;
    turnRight: () => void | undefined;
    goTo: (spineIndexOrIdOrCfi: number | string) => void;
    goToPageOfCurrentChapter: (pageIndex: number) => void | undefined;
    goToNextSpineItem: () => void;
    goToPreviousSpineItem: () => void;
    getPagination(): {
        begin: {
            chapterInfo: import("./navigation").ChapterInfo | undefined;
            pageIndexInChapter: number | undefined;
            numberOfPagesInChapter: number;
            spineItemIndex: number | undefined;
            cfi: string | undefined;
        };
        /**
         * This percentage is based of the weight (kb) of every items and the number of pages.
         * It is not accurate but gives a general good idea of the overall progress.
         * It is recommended to use this progress only for reflow books. For pre-paginated books
         * the number of pages and current index can be used instead since 1 page = 1 chapter.
         */
        percentageEstimateOfBook: number;
        pagesOfBook: number;
        numberOfSpineItems: number;
    } | undefined;
    normalizeEventPositions: (e: PointerEvent | MouseEvent | TouchEvent) => MouseEvent | TouchEvent;
    layout: () => void;
    load: (manifest: Manifest, { fetchResource }?: {
        fetchResource?: "http" | ((item: Manifest['readingOrder'][number]) => Promise<string>) | undefined;
    }, spineIndexOrIdOrCfi?: string | number | undefined) => void;
    destroy: () => void;
    isSelecting: () => boolean | undefined;
    getSelection: () => Selection | undefined;
    $: import("rxjs").Observable<{
        event: 'paginationChange';
    } | {
        event: 'iframe';
        data: HTMLIFrameElement;
    } | {
        event: 'ready';
    }>;
};
