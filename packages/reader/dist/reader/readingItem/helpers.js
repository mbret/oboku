import { createReadingItemFrame } from "./readingItemFrame";
import { getFirstVisibleNodeFromPoint } from "../utils/dom";
import { CFI, extractObokuMetadataFromCfi } from "../cfi";
import { Subject } from "rxjs";
import { Report } from "../../report";
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
export const createSharedHelpers = ({ item, context, containerElement, fetchResource }) => {
    const subject = new Subject();
    const element = createWrapperElement(containerElement, item);
    const loadingElement = createLoadingElement(containerElement, item);
    const readingItemFrame = createReadingItemFrame(element, item, context, { fetchResource });
    let readingItemFrame$;
    const injectStyle = (readingItemFrame, cssText) => {
        readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.removeStyle('ur-css-link');
        readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.addStyle('ur-css-link', cssText);
    };
    const bridgeAllMouseEvents = (frame) => {
        pointerEvents.forEach(event => {
            var _a;
            (_a = frame === null || frame === void 0 ? void 0 : frame.contentDocument) === null || _a === void 0 ? void 0 : _a.addEventListener(event, (e) => {
                // @ts-ignore
                document.getElementById(`BookViewIframeEventIntercept`).dispatchEvent(new PointerEvent(e.type, e));
                // document.getElementById(`BookView`).dispatchEvent(new PointerEvent(e.type, e))
            });
        });
        mouseEvents.forEach(event => {
            var _a;
            (_a = frame === null || frame === void 0 ? void 0 : frame.contentDocument) === null || _a === void 0 ? void 0 : _a.addEventListener(event, (e) => {
                // @ts-ignore
                document.getElementById(`BookViewIframeEventIntercept`).dispatchEvent(new MouseEvent(e.type, e));
                // document.getElementById(`BookView`).dispatchEvent(new MouseEvent(e.type, e))
            });
        });
    };
    const adjustPositionOfElement = (edgeOffset) => {
        if (!edgeOffset)
            return;
        if (context.isRTL()) {
            element.style.right = `${edgeOffset}px`;
        }
        else {
            element.style.left = `${edgeOffset}px`;
        }
    };
    const getFirstNodeOrRangeAtOffset = (offset) => {
        var _a, _b;
        const frame = readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.getFrameElement();
        // return frame?.contentDocument?.body.childNodes[0]
        // return frame?.contentWindow?.document.caretRangeFromPoint(offset, 0).startContainer
        if ((_a = frame === null || frame === void 0 ? void 0 : frame.contentWindow) === null || _a === void 0 ? void 0 : _a.document) {
            return getFirstVisibleNodeFromPoint((_b = frame === null || frame === void 0 ? void 0 : frame.contentWindow) === null || _b === void 0 ? void 0 : _b.document, offset, 0);
        }
        // if (frame) {
        //   const element = Array.from(frame.contentWindow?.document.body.children || []).find(children => {
        //     const { x, width } = children.getBoundingClientRect()
        //     return (x + width) > offset
        //   })
        //   return element?.children[0]
        // }
        return undefined;
    };
    const getCfi = (offset) => {
        var _a, _b;
        const nodeOrRange = getFirstNodeOrRangeAtOffset(offset);
        const doc = (_b = (_a = readingItemFrame.getFrameElement()) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.document;
        const itemAnchor = `|[oboku:${encodeURIComponent(item.id)}]`;
        if (nodeOrRange && doc) {
            const cfiString = CFI.generate(nodeOrRange.startContainer, nodeOrRange.startOffset, itemAnchor);
            // console.log('FOOO', CFI.generate(nodeOrRange.startContainer, nodeOrRange.startOffset))
            return cfiString;
        }
        return `epubcfi(/0${itemAnchor}) `;
    };
    const resolveCfi = (cfiString) => {
        var _a, _b;
        if (!cfiString)
            return undefined;
        const { cleanedCfi } = extractObokuMetadataFromCfi(cfiString);
        const cfi = new CFI(cleanedCfi, {});
        const doc = (_b = (_a = readingItemFrame.getFrameElement()) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.document;
        if (doc) {
            try {
                // console.warn('FIII', cleanedCfi, cfi)
                // console.log('FIII', (new CFI('epubcfi(/2/4/2[_preface]/10/1:175[oboku:id-id2632344]', {})).resolve(doc, {}))
                // const { cleanedCfi: foo, itemId } = extractObokuMetadataFromCfi('epubcfi(/2/4/2[_preface]/10/1:175|[oboku:id-id2632344])')
                // const cfiObject = (new CFI(foo, {}))
                // const resolve = cfiObject.resolve(doc, {})
                // console.warn('FIII', foo, doc, (new CFI(foo, {})), resolve.node, resolve)
                const { node } = cfi.resolve(doc, {});
                // console.log(cfi.resolve(doc, {}))
                return node;
            }
            catch (e) {
                Report.error(e);
                return undefined;
            }
        }
        return undefined;
    };
    const getViewPortInformation = () => {
        const { width: pageWidth, height: pageHeight } = context.getPageSize();
        const viewportDimensions = readingItemFrame.getViewportDimensions();
        const frameElement = readingItemFrame.getFrameElement();
        if (element && (frameElement === null || frameElement === void 0 ? void 0 : frameElement.contentDocument) && (frameElement === null || frameElement === void 0 ? void 0 : frameElement.contentWindow) && viewportDimensions) {
            const computedScale = Math.min(pageWidth / viewportDimensions.width, pageHeight / viewportDimensions.height);
            return { computedScale, viewportDimensions };
        }
        return undefined;
    };
    readingItemFrame$ = readingItemFrame.$.subscribe(({ event }) => {
        if (event === 'isReady') {
            if (loadingElement) {
                loadingElement.style.opacity = `0`;
            }
        }
        if (event === 'layout') {
            subject.next({ event: 'layout' });
        }
    });
    const getFrameLayoutInformation = () => { var _a; return (_a = readingItemFrame.getFrameElement()) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect(); };
    return {
        /**
         * @todo load iframe content later so that resources are less intensives.
         * Right now we load iframe content and kinda block the following of the reader until
         * every reading item have their iframe ready. Ideally we want to start loading iframe
         * only from the first reading item navigated to and then progressively with the adjacent one
         */
        load: () => {
            containerElement.appendChild(element);
            element.appendChild(loadingElement);
        },
        adjustPositionOfElement,
        createWrapperElement,
        createLoadingElement,
        injectStyle,
        bridgeAllMouseEvents,
        getCfi,
        readingItemFrame,
        element,
        loadingElement,
        resolveCfi,
        getFrameLayoutInformation,
        getViewPortInformation,
        isContentReady: () => !!(readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.getIsReady()),
        destroy: () => {
            loadingElement.remove();
            element.remove();
            readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.destroy();
            readingItemFrame$ === null || readingItemFrame$ === void 0 ? void 0 : readingItemFrame$.unsubscribe();
        },
        getReadingDirection: () => {
            return readingItemFrame.getReadingDirection() || context.manifest.readingDirection;
        },
        $: subject,
    };
};
const createWrapperElement = (containerElement, item) => {
    const element = containerElement.ownerDocument.createElement('div');
    element.id = item.id;
    element.classList.add('readingItem');
    element.classList.add(`readingItem-${item.renditionLayout}`);
    element.style.cssText = `
    position: absolute;
    overflow: hidden;
  `;
    return element;
};
const createLoadingElement = (containerElement, item) => {
    const loadingElement = containerElement.ownerDocument.createElement('div');
    loadingElement.classList.add(`loading`);
    loadingElement.style.cssText = `
    height: 100%;
    width: 100vw;
    opacity: 1;
    text-align: center;
    position: absolute;
    pointer-events: none;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  `;
    // loadingElement.innerText = `loading chapter ${item.id}`
    const logoElement = containerElement.ownerDocument.createElement('div');
    logoElement.innerText = `oboku`;
    logoElement.style.cssText = `
    font-size: 4em;
    color: #cacaca;
  `;
    const detailsElement = containerElement.ownerDocument.createElement('div');
    detailsElement.innerText = `loading ${item.id}`;
    detailsElement.style.cssText = `
    font-size: 1.2em;
    color: rgb(202, 202, 202);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 300px;
    width: 80%;
  `;
    loadingElement.appendChild(logoElement);
    loadingElement.appendChild(detailsElement);
    return loadingElement;
};
//# sourceMappingURL=helpers.js.map