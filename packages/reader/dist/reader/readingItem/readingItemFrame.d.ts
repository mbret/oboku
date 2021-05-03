import { Subject } from "rxjs";
import { Manifest } from "../../types";
import { Context } from "../context";
export declare type ReadingItemFrame = ReturnType<typeof createReadingItemFrame>;
export declare const createReadingItemFrame: (parent: HTMLElement, item: Manifest['readingOrder'][number], context: Context, { fetchResource }: {
    fetchResource: "http" | ((item: Manifest['readingOrder'][number]) => Promise<string>);
}) => {
    getIsReady(): boolean;
    getViewportDimensions: () => {
        width: number;
        height: number;
    } | undefined;
    getIsLoaded: () => boolean;
    load: () => Promise<unknown>;
    unload: () => void;
    /**
     * Upward layout is used when the parent wants to manipulate the iframe without triggering
     * `layout` event. This is a particular case needed for iframe because the parent can layout following
     * an iframe `layout` event. Because the parent `layout` may change some of iframe properties we do not
     * want the iframe to trigger a new `layout` even and have infinite loop.
     */
    staticLayout: (size: {
        width: number;
        height: number;
    }) => void;
    getFrameElement: () => HTMLIFrameElement | undefined;
    removeStyle: (id: string) => void;
    addStyle(id: string, style: string, prepend?: boolean): void;
    getReadingDirection: () => 'ltr' | 'rtl' | undefined;
    destroy: () => void;
    $: Subject<{
        event: 'domReady';
        data: HTMLIFrameElement;
    } | {
        event: 'layout';
        data: {
            isFirstLayout: boolean;
            isReady: boolean;
        };
    }>;
};
