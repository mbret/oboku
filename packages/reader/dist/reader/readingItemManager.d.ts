import { Subject } from "rxjs";
import { Context } from "./context";
import { createReadingItem, ReadingItem } from "./readingItem";
export declare type ReadingItemManager = ReturnType<typeof createReadingItemManager>;
export declare const createReadingItemManager: ({ context }: {
    context: Context;
}) => {
    add: (readingItem: ReadingItem) => void;
    get: (indexOrId: number | string) => {
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
            $: Subject<{
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
            $: Subject<{
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
        getBoundingRectOfElementFromSelector: (selector: string) => DOMRect | undefined;
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
        $: Subject<{
            event: "selectionchange" | "selectstart";
            data: Selection;
        } | {
            event: "layout";
            data: {
                isFirstLayout: boolean;
                isReady: boolean;
            };
        }>;
        item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        };
    } | {
        unloadContent: () => void;
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
            $: Subject<{
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
            $: Subject<{
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
        getBoundingRectOfElementFromSelector: (selector: string) => DOMRect | undefined;
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
        $: Subject<{
            event: "selectionchange" | "selectstart";
            data: Selection;
        } | {
            event: "layout";
            data: {
                isFirstLayout: boolean;
                isReady: boolean;
            };
        }>;
        item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        };
    } | undefined;
    set: (readingItems: ReturnType<typeof createReadingItem>[]) => void;
    getLength(): number;
    layout: () => void;
    focus: (indexOrReadingItem: number | ReadingItem) => void;
    loadContents: () => void;
    isAfter: (item1: ReadingItem, item2: ReadingItem) => boolean;
    getPositionOf: (readingItemOrIndex: ReadingItem | number) => {
        start: number;
        end: number;
        height?: number | undefined;
        width?: number | undefined;
        x?: number | undefined;
        y?: number | undefined;
        bottom?: number | undefined;
        left?: number | undefined;
        right?: number | undefined;
        top?: number | undefined;
        toJSON?: (() => any) | undefined;
    };
    getReadingItemAtOffset: (offset: number) => {
        unloadContent: () => void;
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
            $: Subject<{
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
            $: Subject<{
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
        getBoundingRectOfElementFromSelector: (selector: string) => DOMRect | undefined;
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
        $: Subject<{
            event: "selectionchange" | "selectstart";
            data: Selection;
        } | {
            event: "layout";
            data: {
                isFirstLayout: boolean;
                isReady: boolean;
            };
        }>;
        item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        };
    } | undefined;
    getFocusedReadingItem: () => {
        unloadContent: () => void;
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
            $: Subject<{
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
            $: Subject<{
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
        getBoundingRectOfElementFromSelector: (selector: string) => DOMRect | undefined;
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
        $: Subject<{
            event: "selectionchange" | "selectstart";
            data: Selection;
        } | {
            event: "layout";
            data: {
                isFirstLayout: boolean;
                isReady: boolean;
            };
        }>;
        item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        };
    } | undefined;
    getFocusedReadingItemIndex: () => number | undefined;
    destroy: () => void;
    $: import("rxjs").Observable<{
        event: 'focus';
        data: ReadingItem;
    } | {
        event: 'layout';
    }>;
};
