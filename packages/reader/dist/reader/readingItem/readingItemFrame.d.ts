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
    load: (onLoad: (frame: HTMLIFrameElement) => void) => Promise<unknown>;
    unload: () => void;
    layout: (size: {
        width: number;
        height: number;
    }) => void;
    getFrameElement: () => HTMLIFrameElement | undefined;
    removeStyle: (id: string) => void;
    addStyle(id: string, style: string, prepend?: boolean): void;
    getReadingDirection: () => 'ltr' | 'rtl' | undefined;
    destroy: () => void;
    $: Subject<{
        event: 'isReady' | 'layout';
    }>;
};
