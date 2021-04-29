import { Subject } from "rxjs";
import { Manifest } from "./types";
export declare type Context = ReturnType<typeof createContext>;
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
    $: Subject<{
        event: 'iframe';
        data: HTMLIFrameElement;
    }>;
    manifest: Manifest;
};
