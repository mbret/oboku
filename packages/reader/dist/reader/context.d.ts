import { Manifest } from "./types";
export declare type Context = ReturnType<typeof createContext>;
export declare type ContextObservableEvents = {
    event: 'linkClicked';
    data: HTMLAnchorElement;
} | {
    event: 'iframeEvent';
    data: {
        frame: HTMLIFrameElement;
        event: PointerEvent | MouseEvent;
    };
};
export declare const createContext: (manifest: Manifest) => {
    isRTL: () => boolean;
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
};
