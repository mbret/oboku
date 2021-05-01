export { Manifest } from './types';
export declare type Pagination = ReturnType<ReturnType<typeof createReader>['getPagination']>;
export declare const createReader: ({ containerElement }: {
    containerElement: HTMLElement;
}) => {
    layout: () => void;
    load: (manifest: import("@oboku/reader-streamer/dist/types").Manifest, { fetchResource }?: {
        fetchResource?: "http" | ((item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        }) => Promise<string>) | undefined;
    }, spineIndexOrIdOrCfi?: string | number | undefined) => void;
    destroy: () => void;
    $: import("rxjs").Observable<{
        event: "paginationChange";
    } | {
        event: "iframe";
        data: HTMLIFrameElement;
    } | {
        event: "ready";
    }>;
    turnLeft: () => void | undefined;
    turnRight: () => void | undefined;
    goTo: (spineIndexOrIdOrCfi: string | number) => void;
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
        percentageEstimateOfBook: number;
        pagesOfBook: number;
        numberOfSpineItems: number;
    } | undefined;
    normalizeEventPositions: (e: PointerEvent | MouseEvent | TouchEvent) => MouseEvent | TouchEvent;
    isSelecting: () => boolean | undefined;
    getSelection: () => Selection | undefined;
};
export declare type Reader = ReturnType<typeof createReader>;
