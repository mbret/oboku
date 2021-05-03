var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Subject } from "rxjs";
import { Report } from "../../report";
import { applyHooks } from "./iframe/hooks";
export const createReadingItemFrame = (parent, item, context, { fetchResource }) => {
    const subject = new Subject();
    let isLoaded = false;
    let currentLoadingId = 0;
    let loading = false;
    let frameElement;
    let isReady = false;
    const src = item.href;
    const getViewportDimensions = () => {
        if (frameElement && frameElement.contentDocument) {
            const doc = frameElement.contentDocument;
            const viewPortMeta = doc.querySelector("meta[name='viewport']");
            if (viewPortMeta) {
                const viewPortMetaInfos = viewPortMeta.getAttribute('content');
                if (viewPortMetaInfos) {
                    const width = getAttributeValueFromString(viewPortMetaInfos, 'width');
                    const height = getAttributeValueFromString(viewPortMetaInfos, 'height');
                    if (width > 0 && height > 0) {
                        return {
                            width: width,
                            height: height,
                        };
                    }
                    else {
                        return undefined;
                    }
                }
            }
        }
        return undefined;
    };
    const unload = () => {
        isReady = false;
        isLoaded = false;
        loading = false;
        frameElement === null || frameElement === void 0 ? void 0 : frameElement.remove();
        frameElement = undefined;
    };
    return {
        getIsReady() {
            return isReady;
        },
        getViewportDimensions,
        getIsLoaded: () => isLoaded,
        load: Report.measurePerformance(`ReadingItemFrame load`, Infinity, () => __awaiter(void 0, void 0, void 0, function* () {
            if (loading)
                return;
            loading = true;
            const currentLoading = ++currentLoadingId;
            const isCancelled = () => !(loading && currentLoading === currentLoadingId);
            frameElement = yield createFrame(parent);
            const t0 = performance.now();
            if (fetchResource === 'http') {
                frameElement.src = src;
            }
            else {
                frameElement.srcdoc = yield fetchResource(item);
            }
            return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
                if (frameElement && !isCancelled()) {
                    frameElement.setAttribute('sandbox', 'allow-same-origin allow-scripts');
                    frameElement.onload = (e) => {
                        var _a;
                        const t1 = performance.now();
                        Report.metric({ name: `ReadingItemFrame load:3`, duration: t1 - t0 });
                        if (frameElement && !isCancelled()) {
                            frameElement.onload = null;
                            frameElement.setAttribute('role', 'main');
                            frameElement.setAttribute('tab-index', '0');
                            isLoaded = true;
                            applyHooks(context, parent.ownerDocument, frameElement);
                            subject.next({ event: 'domReady', data: frameElement });
                            (_a = frameElement.contentDocument) === null || _a === void 0 ? void 0 : _a.fonts.ready.then(() => {
                                if (frameElement && !isCancelled()) {
                                    isReady = true;
                                    subject.next({ event: 'layout', data: { isFirstLayout: true, isReady: true } });
                                }
                            });
                            resolve(true);
                        }
                    };
                }
            }));
        })),
        unload,
        /**
         * Upward layout is used when the parent wants to manipulate the iframe without triggering
         * `layout` event. This is a particular case needed for iframe because the parent can layout following
         * an iframe `layout` event. Because the parent `layout` may change some of iframe properties we do not
         * want the iframe to trigger a new `layout` even and have infinite loop.
         */
        staticLayout: (size) => {
            if (frameElement) {
                frameElement.style.width = `${size.width}px`;
                frameElement.style.height = `${size.height}px`;
            }
        },
        getFrameElement: () => frameElement,
        removeStyle: (id) => {
            if (frameElement &&
                frameElement.contentDocument &&
                frameElement.contentDocument.head) {
                const styleElement = frameElement.contentDocument.getElementById(id);
                if (styleElement) {
                    styleElement.remove();
                }
            }
        },
        addStyle(id, style, prepend = false) {
            if (frameElement &&
                frameElement.contentDocument &&
                frameElement.contentDocument.head) {
                const userStyle = document.createElement('style');
                userStyle.id = id;
                userStyle.innerHTML = style;
                if (prepend) {
                    frameElement.contentDocument.head.prepend(userStyle);
                }
                else {
                    frameElement.contentDocument.head.appendChild(userStyle);
                }
            }
        },
        getReadingDirection: () => {
            var _a;
            if ((frameElement === null || frameElement === void 0 ? void 0 : frameElement.contentWindow) && ((_a = frameElement === null || frameElement === void 0 ? void 0 : frameElement.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
                const direction = frameElement.contentWindow.getComputedStyle(frameElement.contentDocument.body).direction;
                if (['ltr', 'rtl'].includes(direction))
                    return direction;
            }
            return undefined;
        },
        destroy: () => {
            unload();
        },
        $: subject,
    };
};
const createFrame = Report.measurePerformance(`ReadingItemFrame createFrame`, Infinity, (container) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const frame = document.createElement('iframe');
        frame.frameBorder = 'no';
        frame.setAttribute('sandbox', 'allow-same-origin allow-scripts');
        // const accessibilityLayout = ReadingSingleton.getInstance().getViewContext()
        //   .accessibilityLayout
        // if (!accessibilityLayout) {
        //   frame.scrolling = 'no'
        // }
        // frame.onload = () => {
        //   frame.onload = null
        //   frame.setAttribute('role', 'main')
        //   frame.setAttribute('tab-index', '0')
        //   resolve(frame)
        // }
        resolve(frame);
        container.appendChild(frame);
    });
}));
const getAttributeValueFromString = (string, key) => {
    const regExp = new RegExp(key + '\\s*=\\s*([0-9.]+)', 'i');
    const match = string.match(regExp) || [];
    const firstMatch = match[1] || `0`;
    return (match && parseFloat(firstMatch)) || 0;
};
//# sourceMappingURL=readingItemFrame.js.map