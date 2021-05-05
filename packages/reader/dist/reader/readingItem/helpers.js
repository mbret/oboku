var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createReadingItemFrame } from "./readingItemFrame";
import { getFirstVisibleNodeForViewport } from "../utils/dom";
import { CFI, extractObokuMetadataFromCfi } from "../cfi";
import { Subject } from "rxjs";
import { Report } from "../../report";
export const createSharedHelpers = ({ item, context, containerElement }) => {
    const subject = new Subject();
    const element = createWrapperElement(containerElement, item);
    const loadingElement = createLoadingElement(containerElement, item);
    const readingItemFrame = createReadingItemFrame(element, item, context);
    let readingItemFrame$;
    const injectStyle = (readingItemFrame, cssText) => {
        readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.removeStyle('ur-css-link');
        readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.addStyle('ur-css-link', cssText);
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
    const getFirstNodeOrRangeAtPage = (pageIndex) => {
        var _a;
        const pageSize = context.getPageSize();
        const frame = readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.getFrameElement();
        const yOffset = 0 + context.getVerticalMargin();
        // return frame?.contentDocument?.body.childNodes[0]
        // return frame?.contentWindow?.document.caretRangeFromPoint(offset, 0).startContainer
        if (((_a = frame === null || frame === void 0 ? void 0 : frame.contentWindow) === null || _a === void 0 ? void 0 : _a.document)
            // very important because it is being used by next functions
            && frame.contentWindow.document.body !== null) {
            const viewport = {
                left: pageIndex * pageSize.width,
                right: (pageIndex * pageSize.width) + pageSize.width,
                top: 0,
                bottom: pageSize.height
            };
            const res = getFirstVisibleNodeForViewport(frame.contentWindow.document, viewport);
            // const res = getFirstVisibleNodeFromPoint(frame?.contentWindow?.document, offsetInReadingItem, yOffset)
            // if (res && `offsetNode` in res) {
            //   return { node: res.offsetNode, offset: 0 }
            // }
            // if (res && `startContainer` in res) {
            //   return { node: res.startContainer, offset: res.startOffset }
            // }
            return res;
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
    const getCfi = Report.measurePerformance(`getCfi`, 10, (pageIndex) => {
        var _a, _b;
        const nodeOrRange = getFirstNodeOrRangeAtPage(pageIndex);
        const doc = (_b = (_a = readingItemFrame.getFrameElement()) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.document;
        const itemAnchor = `|[oboku~anchor~${encodeURIComponent(item.id)}]`;
        // because the current cfi library does not works well with offset we are just using custom
        // format and do it manually after resolving the node
        // @see https://github.com/fread-ink/epub-cfi-resolver/issues/8
        const offset = `|[oboku~offset~${(nodeOrRange === null || nodeOrRange === void 0 ? void 0 : nodeOrRange.offset) || 0}]`;
        if (nodeOrRange && doc) {
            const cfiString = CFI.generate(nodeOrRange.node, 0, `${itemAnchor}${offset}`);
            // console.log('FOOO', CFI.generate(nodeOrRange.startContainer, nodeOrRange.startOffset))
            return cfiString;
        }
        return `epubcfi(/0${itemAnchor}) `;
    });
    const resolveCfi = (cfiString) => {
        var _a, _b;
        if (!cfiString)
            return undefined;
        const { cleanedCfi, offset } = extractObokuMetadataFromCfi(cfiString);
        const cfi = new CFI(cleanedCfi, {});
        const doc = (_b = (_a = readingItemFrame.getFrameElement()) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.document;
        if (doc) {
            try {
                // console.warn('FIII', cleanedCfi, cfi)
                // console.log('FIII', (new CFI('epubcfi(/2/4/2[_preface]/10/1:175[oboku:id-id2632344]', {})).resolve(doc, {}))
                // const { cleanedCfi: foo, itemId } = extractObokuMetadataFromCfi('epubcfi(/2/4/2[I_book_d1e1]/14/2[id2602563]/4/1:190|[oboku:id-id2442754])')
                // const { cleanedCfi: foo, itemId } = extractObokuMetadataFromCfi('epubcfi(/2/4/2[I_book_d1e1]/14/2[id2602563]/4/1:100|[oboku:id-id2442754])')
                // const cfiObject = (new CFI(foo, {}))
                // const resolve = cfiObject.resolve(doc, {})
                // console.warn('FIII', foo, (new CFI(foo, {})), resolve.node, resolve)
                const { node } = cfi.resolve(doc, {});
                // console.warn(cleanedCfi, cfi.resolve(doc, {}), offset)
                return { node, offset };
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
    readingItemFrame$ = readingItemFrame.$.subscribe((event) => {
        if (event.event === 'layout') {
            if (event.data.isFirstLayout && event.data.isReady) {
                loadingElement.style.opacity = `0`;
            }
        }
    });
    const getFrameLayoutInformation = () => { var _a; return (_a = readingItemFrame.getFrameElement()) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect(); };
    const loadContent = () => {
        readingItemFrame.load().catch(Report.error);
    };
    const unloadContent = () => __awaiter(void 0, void 0, void 0, function* () {
        readingItemFrame.unload();
        if (loadingElement) {
            loadingElement.style.opacity = `1`;
        }
    });
    const getBoundingRectOfElementFromSelector = (selector) => {
        var _a, _b;
        const frame = readingItemFrame.getFrameElement();
        if (frame) {
            return (_b = (_a = frame.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelector(selector)) === null || _b === void 0 ? void 0 : _b.getBoundingClientRect();
        }
    };
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
        getCfi,
        loadContent,
        unloadContent,
        readingItemFrame,
        element,
        loadingElement,
        resolveCfi,
        getFrameLayoutInformation,
        getBoundingRectOfElementFromSelector,
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
        getIsReady: () => readingItemFrame.getIsReady(),
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