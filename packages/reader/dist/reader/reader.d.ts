import { Subject } from "rxjs";
import { ContextObservableEvents } from "./context";
import { LoadOptions, Manifest } from "./types";
export declare const createReader: ({ containerElement }: {
    containerElement: HTMLElement;
}) => {
    getReadingOrderView: () => {
        readingItemManager: {
            add: (readingItem: {
                getBoundingClientRect: () => {
                    width: number;
                    x: number;
                    left: number;
                    y: number;
                    top: number;
                    height: number;
                    bottom: number;
                    right: number;
                    toJSON(): any;
                };
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
            }) => void;
            get: (indexOrId: string | number) => {
                getBoundingClientRect: () => {
                    width: number;
                    x: number;
                    left: number;
                    y: number;
                    top: number;
                    height: number;
                    bottom: number;
                    right: number;
                    toJSON(): any;
                };
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
            set: (readingItems: ({
                getBoundingClientRect: () => {
                    width: number;
                    x: number;
                    left: number;
                    y: number;
                    top: number;
                    height: number;
                    bottom: number;
                    right: number;
                    toJSON(): any;
                };
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
            })[]) => void;
            getLength(): number;
            layout: () => void;
            focus: (indexOrReadingItem: number | {
                getBoundingClientRect: () => {
                    width: number;
                    x: number;
                    left: number;
                    y: number;
                    top: number;
                    height: number;
                    bottom: number;
                    right: number;
                    toJSON(): any;
                };
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
            }) => void;
            loadContents: () => void;
            isAfter: (item1: {
                getBoundingClientRect: () => {
                    width: number;
                    x: number;
                    left: number;
                    y: number;
                    top: number;
                    height: number;
                    bottom: number;
                    right: number;
                    toJSON(): any;
                };
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
            }, item2: {
                getBoundingClientRect: () => {
                    width: number;
                    x: number;
                    left: number;
                    y: number;
                    top: number;
                    height: number;
                    bottom: number;
                    right: number;
                    toJSON(): any;
                };
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
            }) => boolean;
            getPositionOf: (readingItemOrIndex: number | {
                getBoundingClientRect: () => {
                    width: number;
                    x: number;
                    left: number;
                    y: number;
                    top: number;
                    height: number;
                    bottom: number;
                    right: number;
                    toJSON(): any;
                };
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
            }) => {
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
                event: "focus";
                data: {
                    getBoundingClientRect: () => {
                        width: number;
                        x: number;
                        left: number;
                        y: number;
                        top: number;
                        height: number;
                        bottom: number;
                        right: number;
                        toJSON(): any;
                    };
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
                };
            } | {
                event: "layout";
            }>;
        };
        goToNextSpineItem: () => void;
        goToPreviousSpineItem: () => void;
        load: () => void;
        layout: () => void;
        getChapterInfo(): import("./navigation").ChapterInfo | undefined;
        destroy: () => void;
        isSelecting: () => boolean | undefined;
        getSelection: () => Selection | undefined;
        $: Subject<unknown>;
        adjustOffset: (offset: number) => void;
        getCurrentOffset: () => number;
        turnLeft: (args_0?: {
            allowReadingItemChange?: boolean | undefined;
        } | undefined) => void;
        turnRight: (args_0?: {
            allowReadingItemChange?: boolean | undefined;
        } | undefined) => void;
        goTo: (spineIndexOrSpineItemIdOrPathCfi: string | number | URL) => void;
        goToPageOfCurrentChapter: (pageIndex: number) => void;
        adjustReadingOffsetPosition: ({ shouldAdjustCfi }: {
            shouldAdjustCfi: boolean;
        }) => void;
    } | undefined;
    getContext: () => {
        isRTL: () => boolean;
        getLoadOptions: () => LoadOptions;
        getCalculatedInnerMargin: () => number;
        getVisibleAreaRect: () => {
            width: number;
            height: number;
            x: number;
            y: number;
        };
        setVisibleAreaRect: (x: number, y: number, width: number, height: number) => void;
        getHorizontalMargin: () => number;
        getVerticalMargin: () => number;
        getPageSize: () => {
            width: number;
            height: number;
        };
        $: import("rxjs").Observable<ContextObservableEvents>;
        emit: (data: ContextObservableEvents) => void;
        manifest: Manifest;
    } | undefined;
    getPagination: () => {
        getPageIndex(): number | undefined;
        getNumberOfPages(): number;
        update: (readingItem: {
            getBoundingClientRect: () => {
                width: number;
                x: number;
                left: number;
                y: number;
                top: number;
                height: number;
                bottom: number;
                right: number;
                toJSON(): any;
            };
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
        }, offsetInReadingItem: number, options: {
            isAtEndOfChapter: boolean;
            shouldUpdateCfi: boolean;
        }) => void;
        getCfi(): string | undefined;
        $: import("rxjs").Observable<{
            event: "change";
        }>;
    } | undefined;
    getIframeEventBridge: () => {
        iframeEventBridgeElement: HTMLDivElement;
        iframeEventBridgeElementLastContext: {
            event: Event;
            iframeTarget: Event['target'];
        } | undefined;
    };
    layout: () => void;
    load: (manifest: Manifest, loadOptions?: LoadOptions, spineIndexOrIdOrCfi?: string | number | undefined) => void;
    destroy: () => void;
    $: import("rxjs").Observable<ContextObservableEvents | {
        event: 'paginationChange';
    } | {
        event: 'iframe';
        data: HTMLIFrameElement;
    } | {
        event: 'ready';
    }>;
};
