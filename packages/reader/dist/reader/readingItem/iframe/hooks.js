import { Report } from "../../../report";
const pointerEvents = [
    "pointercancel",
    "pointerdown",
    "pointerenter",
    "pointerleave",
    "pointermove",
    "pointerout",
    "pointerover",
    "pointerup"
];
const mouseEvents = [
    'mousedown',
    'mouseup',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
];
export const applyHooks = (context, rootDocument, frame) => {
    if (frame.contentDocument) {
        hookAnchorLinks(context, frame.contentDocument);
        hookMouseEvents(context, rootDocument, frame);
    }
};
const hookAnchorLinks = (context, frameDocument) => {
    Array.from(frameDocument.querySelectorAll('a')).forEach(element => element.addEventListener('click', (e) => {
        if (e.target && `style` in e.target && `ELEMENT_NODE` in e.target) {
            Report.warn(`prevented click on`, element, e);
            context.emit({ event: `linkClicked`, data: element });
            e.preventDefault();
        }
    }));
};
const hookMouseEvents = (context, _, frame) => {
    pointerEvents.forEach(event => {
        var _a;
        (_a = frame.contentDocument) === null || _a === void 0 ? void 0 : _a.addEventListener(event, (e) => {
            context.emit({ event: 'iframeEvent', data: { frame, event: e } });
        });
    });
    mouseEvents.forEach(event => {
        var _a;
        (_a = frame.contentDocument) === null || _a === void 0 ? void 0 : _a.addEventListener(event, (e) => {
            context.emit({ event: 'iframeEvent', data: { frame, event: e } });
        });
    });
};
//# sourceMappingURL=hooks.js.map