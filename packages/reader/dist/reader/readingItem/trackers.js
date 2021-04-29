import { Subject } from "rxjs";
export const createFingerTracker = () => {
    let fingerPositionInIframe = { x: undefined, y: undefined };
    const subject = new Subject();
    let isMouseDown = false;
    const track = (frame) => {
        var _a, _b, _c;
        fingerPositionInIframe.x = undefined;
        fingerPositionInIframe.y = undefined;
        (_a = frame.contentDocument) === null || _a === void 0 ? void 0 : _a.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            fingerPositionInIframe.x = e.x;
            fingerPositionInIframe.y = e.y;
            subject.next({ event: 'fingermove', data: { x: e.x, y: e.y } });
        });
        (_b = frame.contentDocument) === null || _b === void 0 ? void 0 : _b.addEventListener('mouseup', (e) => {
            isMouseDown = false;
            fingerPositionInIframe.x = undefined;
            fingerPositionInIframe.y = undefined;
            subject.next({ event: 'fingerout', data: undefined });
        });
        (_c = frame.contentDocument) === null || _c === void 0 ? void 0 : _c.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                subject.next({ event: 'fingermove', data: { x: e.x, y: e.y } });
            }
        });
    };
    return {
        track,
        getFingerPositionInIframe() {
            return (fingerPositionInIframe.x === undefined || fingerPositionInIframe.y === undefined) ? undefined : fingerPositionInIframe;
        },
        destroy: () => {
        },
        $: subject.asObservable()
    };
};
export const createSelectionTracker = () => {
    let isSelecting = false;
    let frame;
    const subject = new Subject();
    const track = (frameToTrack) => {
        var _a, _b, _c;
        frame = frameToTrack;
        (_a = frameToTrack.contentWindow) === null || _a === void 0 ? void 0 : _a.addEventListener('mouseup', (e) => {
            var _a;
            isSelecting = false;
            subject.next({ event: 'selectend', data: (_a = frame === null || frame === void 0 ? void 0 : frame.contentDocument) === null || _a === void 0 ? void 0 : _a.getSelection() });
        });
        (_b = frameToTrack.contentWindow) === null || _b === void 0 ? void 0 : _b.addEventListener('selectionchange', e => {
            var _a;
            subject.next({ event: 'selectionchange', data: (_a = frame === null || frame === void 0 ? void 0 : frame.contentDocument) === null || _a === void 0 ? void 0 : _a.getSelection() });
        });
        (_c = frameToTrack.contentWindow) === null || _c === void 0 ? void 0 : _c.addEventListener('selectstart', e => {
            var _a;
            isSelecting = true;
            subject.next({ event: 'selectstart', data: (_a = frame === null || frame === void 0 ? void 0 : frame.contentDocument) === null || _a === void 0 ? void 0 : _a.getSelection() });
        });
    };
    return {
        track,
        destroy: () => {
        },
        isSelecting: () => isSelecting,
        getSelection: () => {
            var _a;
            const selection = (_a = frame === null || frame === void 0 ? void 0 : frame.contentWindow) === null || _a === void 0 ? void 0 : _a.getSelection();
            if (!(selection === null || selection === void 0 ? void 0 : selection.anchorNode) || selection.type === 'None' || selection.type === 'Caret')
                return undefined;
            // console.log(selection)
            return selection;
        },
        $: subject.asObservable(),
    };
};
//# sourceMappingURL=trackers.js.map