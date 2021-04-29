export declare const createFingerTracker: () => {
    track: (frame: HTMLIFrameElement) => void;
    getFingerPositionInIframe(): {
        x: number;
        y: number;
    } | undefined;
    destroy: () => void;
    $: import("rxjs").Observable<{
        event: 'fingermove';
        data: {
            x: number;
            y: number;
        };
    } | {
        event: 'fingerout';
        data: undefined;
    }>;
};
export declare const createSelectionTracker: () => {
    track: (frameToTrack: HTMLIFrameElement) => void;
    destroy: () => void;
    isSelecting: () => boolean;
    getSelection: () => Selection | undefined;
    $: import("rxjs").Observable<{
        event: 'selectionchange' | 'selectstart' | 'selectend';
        data: Selection | null | undefined;
    }>;
};
