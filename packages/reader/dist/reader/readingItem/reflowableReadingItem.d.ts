import { Context } from "../context";
import { Manifest } from "../types";
export declare const createReflowableReadingItem: ({ item, context, containerElement, fetchResource }: {
    item: Manifest['readingOrder'][number];
    containerElement: HTMLElement;
    context: Context;
    fetchResource: "http" | ((item: Manifest['readingOrder'][number]) => Promise<string>);
}) => {
    getBoundingClientRect: () => DOMRect;
    loadContent: () => Promise<void>;
    unloadContent: () => Promise<void>;
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
        } | undefined;
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
        load: (onLoad: (frame: HTMLIFrameElement) => void) => Promise<unknown>;
        unload: () => void;
        layout: (size: {
            width: number;
            height: number;
        }) => void;
        getFrameElement: () => HTMLIFrameElement | undefined;
        removeStyle: (id: string) => void;
        addStyle(id: string, style: string, prepend?: boolean): void;
        getReadingDirection: () => "ltr" | "rtl" | undefined;
        destroy: () => void;
        $: import("rxjs").Subject<{
            event: "layout" | "isReady";
        }>;
    }, cssText: string) => void;
    bridgeAllMouseEvents: (frame: HTMLIFrameElement) => void;
    getCfi: (offset: number) => string;
    readingItemFrame: {
        getIsReady(): boolean;
        getViewportDimensions: () => {
            width: number;
            height: number;
        } | undefined;
        getIsLoaded: () => boolean;
        load: (onLoad: (frame: HTMLIFrameElement) => void) => Promise<unknown>;
        unload: () => void;
        layout: (size: {
            width: number;
            height: number;
        }) => void;
        getFrameElement: () => HTMLIFrameElement | undefined;
        removeStyle: (id: string) => void;
        addStyle(id: string, style: string, prepend?: boolean): void;
        getReadingDirection: () => "ltr" | "rtl" | undefined;
        destroy: () => void;
        $: import("rxjs").Subject<{
            event: "layout" | "isReady";
        }>;
    };
    element: HTMLDivElement;
    loadingElement: HTMLDivElement;
    resolveCfi: (cfiString: string | undefined) => Node | undefined;
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
    $: import("rxjs").Subject<{
        event: "selectionchange" | "selectstart";
        data: Selection;
    } | {
        event: "layout";
    }>;
};
