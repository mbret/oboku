import { createReader } from "./reader";
export declare const createPublicApi: (reader: ReturnType<typeof createReader>) => {
    layout: () => void;
    load: (manifest: import("@oboku/reader-streamer").Manifest, loadOptions?: import("./types").LoadOptions, spineIndexOrIdOrCfi?: string | number | undefined) => void;
    destroy: () => void;
    $: import("rxjs").Observable<import("./context").ContextObservableEvents | {
        event: "paginationChange";
    } | {
        event: "iframe";
        data: HTMLIFrameElement;
    } | {
        event: "ready";
    }>;
    turnLeft: () => void | undefined;
    turnRight: () => void | undefined;
    goTo: (spineIndexOrIdOrCfi: number | string) => void;
    goToPath: (path: string) => void;
    goToHref: (href: string) => void;
    goToPageOfCurrentChapter: (pageIndex: number) => void | undefined;
    goToNextSpineItem: () => void;
    goToPreviousSpineItem: () => void;
    goToLeftSpineItem: () => void;
    goToRightSpineItem: () => void;
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
    getEventInformation: (e: PointerEvent | MouseEvent | TouchEvent) => {
        event: PointerEvent | MouseEvent | TouchEvent;
        normalizedEventPointerPositions: {
            x?: number | undefined;
            clientX?: number | undefined;
        };
        iframeOriginalEvent?: undefined;
    } | {
        event: PointerEvent | MouseEvent | TouchEvent;
        iframeOriginalEvent: Event | undefined;
        normalizedEventPointerPositions: {
            x: number;
            clientX?: number | undefined;
        };
    };
    isSelecting: () => boolean | undefined;
    getSelection: () => Selection | undefined;
    getManifest: () => import("@oboku/reader-streamer").Manifest | undefined;
};
