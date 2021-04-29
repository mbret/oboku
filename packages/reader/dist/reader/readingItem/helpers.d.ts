import { Context } from "../context";
import { ReadingItemFrame } from "./readingItemFrame";
import { Manifest } from "../types";
import { Subject } from "rxjs";
export declare const createSharedHelpers: ({ item, context, containerElement, fetchResource }: {
    item: Manifest['readingOrder'][number];
    containerElement: HTMLElement;
    context: Context;
    fetchResource: "http" | ((item: Manifest['readingOrder'][number]) => Promise<string>);
}) => {
    /**
     * @todo load iframe content later so that resources are less intensives.
     * Right now we load iframe content and kinda block the following of the reader until
     * every reading item have their iframe ready. Ideally we want to start loading iframe
     * only from the first reading item navigated to and then progressively with the adjacent one
     */
    load: () => void;
    adjustPositionOfElement: (edgeOffset: number | undefined) => void;
    createWrapperElement: (containerElement: HTMLElement, item: Manifest['readingOrder'][number]) => HTMLDivElement;
    createLoadingElement: (containerElement: HTMLElement, item: Manifest['readingOrder'][number]) => HTMLDivElement;
    injectStyle: (readingItemFrame: ReadingItemFrame, cssText: string) => void;
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
        $: Subject<{
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
    destroy: () => void;
    getReadingDirection: () => "ltr" | "rtl";
    $: Subject<{
        event: 'selectionchange' | 'selectstart';
        data: Selection;
    } | {
        event: 'layout';
    }>;
};
