import { Context } from "../context";
import { Manifest } from "../types";
export declare const createReflowableReadingItem: ({ item, context, containerElement }: {
    item: Manifest['readingOrder'][number];
    containerElement: HTMLElement;
    context: Context;
}) => {
    getBoundingClientRect: () => DOMRect;
    layout: () => {
        width: number;
        height: number;
        x: number;
    };
    fingerTracker: {
        track: (frame: HTMLIFrameElement) => void;
        getFingerPositionInIframe(): {
            x: number;
            y: number;
        } | undefined; /**
         * if there is no frame it means the content is not active yet
         * we will just use page to resize
         */
        destroy: () => void;
        $: import("rxjs").Observable<{
            event: "fingermove";
            data: {
                x: number;
                y: number;
            };
        } | {
            event: "fingerout";
            data: undefined;
        }>;
    };
    selectionTracker: {
        track: (frameToTrack: HTMLIFrameElement) => void;
        destroy: () => void;
        isSelecting: () => boolean;
        getSelection: () => Selection | undefined;
        $: import("rxjs").Observable<{
            event: "selectionchange" | "selectstart" | "selectend";
            data: Selection | null | undefined;
        }>;
    };
    destroy: () => void;
    load: () => void;
    adjustPositionOfElement: (edgeOffset: number | undefined) => void;
    createWrapperElement: (containerElement: HTMLElement, item: {
        id: string;
        href: string;
        path: string;
        renditionLayout: "reflowable" | "pre-paginated";
        progressionWeight: number;
    }) => HTMLDivElement;
    createLoadingElement: (containerElement: HTMLElement, item: {
        id: string;
        href: string;
        path: string;
        renditionLayout: "reflowable" | "pre-paginated";
        progressionWeight: number;
    }) => HTMLDivElement;
    injectStyle: (readingItemFrame: {
        getIsReady(): boolean;
        getViewportDimensions: () => {
            width: number;
            height: number;
        } | undefined;
        getIsLoaded: () => boolean;
        load: () => Promise<unknown>;
        unload: () => void;
        staticLayout: (size: {
            width: number;
            height: number;
        }) => void;
        getFrameElement: () => HTMLIFrameElement | undefined;
        removeStyle: (id: string) => void;
        addStyle(id: string, style: string, prepend?: boolean): void;
        getReadingDirection: () => "ltr" | "rtl" | undefined;
        destroy: () => void;
        $: import("rxjs").Subject<{
            event: "domReady";
            data: HTMLIFrameElement;
        } | {
            event: "layout";
            data: {
                isFirstLayout: boolean;
                isReady: boolean;
            };
        }>;
    }, cssText: string) => void;
    getCfi: (pageIndex: number) => string;
    loadContent: () => void;
    unloadContent: () => Promise<void>;
    readingItemFrame: {
        getIsReady(): boolean;
        getViewportDimensions: () => {
            width: number;
            height: number;
        } | undefined;
        getIsLoaded: () => boolean;
        load: () => Promise<unknown>;
        unload: () => void;
        staticLayout: (size: {
            width: number;
            height: number;
        }) => void;
        getFrameElement: () => HTMLIFrameElement | undefined;
        removeStyle: (id: string) => void;
        addStyle(id: string, style: string, prepend?: boolean): void;
        getReadingDirection: () => "ltr" | "rtl" | undefined;
        destroy: () => void;
        $: import("rxjs").Subject<{
            event: "domReady";
            data: HTMLIFrameElement;
        } | {
            event: "layout";
            data: {
                isFirstLayout: boolean;
                isReady: boolean;
            };
        }>;
    };
    element: HTMLDivElement;
    loadingElement: HTMLDivElement;
    resolveCfi: (cfiString: string | undefined) => {
        node: Node | undefined;
        offset: number;
    } | undefined;
    getFrameLayoutInformation: () => DOMRect | undefined;
    getViewPortInformation: () => {
        computedScale: number;
        viewportDimensions: {
            width: number;
            height: number;
        };
    } | undefined;
    isContentReady: () => boolean;
    getReadingDirection: () => "ltr" | "rtl";
    getIsReady: () => boolean;
    $: import("rxjs").Subject<{
        event: "selectionchange" | "selectstart";
        data: Selection;
    } | {
        event: "layout";
        data: {
            isFirstLayout: boolean;
            isReady: boolean;
        };
    }>;
};
