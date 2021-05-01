var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createSharedHelpers } from "./helpers";
import { createFingerTracker, createSelectionTracker } from "./trackers";
export const createPrePaginatedReadingItem = ({ item, context, containerElement, fetchResource }) => {
    const helpers = createSharedHelpers({ context, item, containerElement, fetchResource });
    let element = helpers.element;
    let loadingElement = helpers.loadingElement;
    let readingItemFrame = helpers.readingItemFrame;
    const fingerTracker = createFingerTracker();
    const selectionTracker = createSelectionTracker();
    let readingItemFrame$;
    const getDimensions = () => {
        const pageSize = context.getPageSize();
        const pageWidth = pageSize.width;
        const columnHeight = pageSize.height;
        const horizontalMargin = 0;
        const columnWidth = pageWidth;
        return { columnHeight, columnWidth, horizontalMargin };
    };
    const applySize = () => {
        const { width: pageWidth, height: pageHeight } = context.getPageSize();
        if (!element)
            return { width: pageWidth, height: pageHeight };
        /**
         * if there is no frame it means the content is not active yet
         * we will just use page to resize
         */
        if (!(readingItemFrame === null || readingItemFrame === void 0 ? void 0 : readingItemFrame.getIsLoaded())) {
            const { width, height } = context.getPageSize();
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;
            return { width, height };
        }
        const { viewportDimensions, computedScale } = helpers.getViewPortInformation() || {};
        const visibleArea = context.getVisibleAreaRect();
        const frameElement = readingItemFrame.getFrameElement();
        if (element && (frameElement === null || frameElement === void 0 ? void 0 : frameElement.contentDocument) && (frameElement === null || frameElement === void 0 ? void 0 : frameElement.contentWindow)) {
            let contentWidth = pageWidth;
            const contentHeight = visibleArea.height + context.getCalculatedInnerMargin();
            // debugger
            // console.log('PAGES', frameElement.contentWindow.document.body.scrollWidth, pageWidth)
            const cssLink = buildDefaultStyle(getDimensions());
            if (viewportDimensions) {
                helpers.injectStyle(readingItemFrame, cssLink);
                readingItemFrame.staticLayout({
                    width: viewportDimensions.width,
                    height: viewportDimensions.height,
                });
                frameElement === null || frameElement === void 0 ? void 0 : frameElement.style.setProperty('--scale', `${computedScale}`);
                frameElement === null || frameElement === void 0 ? void 0 : frameElement.style.setProperty('position', `absolute`);
                frameElement === null || frameElement === void 0 ? void 0 : frameElement.style.setProperty(`top`, `50%`);
                frameElement === null || frameElement === void 0 ? void 0 : frameElement.style.setProperty(`left`, `50%`);
                frameElement === null || frameElement === void 0 ? void 0 : frameElement.style.setProperty(`transform`, `translate(-50%, -50%) scale(${computedScale})`);
                frameElement === null || frameElement === void 0 ? void 0 : frameElement.style.setProperty(`transform-origin`, `center center`);
            }
            else {
                helpers.injectStyle(readingItemFrame, cssLink);
                readingItemFrame.staticLayout({
                    width: contentWidth,
                    height: contentHeight,
                });
            }
            element.style.width = `${contentWidth}px`;
            element.style.height = `${contentHeight}px`;
            return { width: contentWidth, height: contentHeight };
        }
        return { width: pageWidth, height: pageHeight };
    };
    const layout = () => {
        const newSize = applySize();
        return {
            width: newSize.width,
            height: newSize.height,
            x: element === null || element === void 0 ? void 0 : element.getBoundingClientRect().x
        };
    };
    const loadContent = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!readingItemFrame || readingItemFrame.getIsLoaded())
            return;
        // @todo handle timeout for iframe loading
        yield readingItemFrame.load(frame => {
            fingerTracker.track(frame);
            selectionTracker.track(frame);
            helpers.bridgeAllMouseEvents(frame);
            applySize();
        });
    });
    const unloadContent = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!readingItemFrame)
            return;
        readingItemFrame.unload();
        if (loadingElement) {
            loadingElement.style.opacity = `1`;
        }
    });
    helpers.readingItemFrame.$.subscribe((data) => {
        if (data.event === 'layout') {
            layout();
            helpers.$.next(data);
        }
    });
    return Object.assign(Object.assign({}, helpers), { getBoundingClientRect: () => element === null || element === void 0 ? void 0 : element.getBoundingClientRect(), loadContent,
        unloadContent,
        layout,
        fingerTracker,
        selectionTracker, destroy: () => {
            helpers.destroy();
            readingItemFrame$ === null || readingItemFrame$ === void 0 ? void 0 : readingItemFrame$.unsubscribe();
            fingerTracker.destroy();
            selectionTracker.destroy();
        } });
};
const buildDefaultStyle = ({ columnHeight, columnWidth, horizontalMargin }) => {
    return `
    body {
      
    }
    body {
      margin: 0;
    }
    ${ /*
      might be html * but it does mess up things like figure if so.
      check accessible_epub_3
    */``}
    html, body {
      height: 100%;
      width: 100%;
    }
    ${ /*
      This one is important for preventing 100% img to resize above
      current width. Especially needed for cbz conversion
    */``}
    html, body {
      -max-width: ${columnWidth}px !important;
    }
    ${ /*
      needed for hammer to work with things like velocity
    */``}
    html, body {
      touch-action: pan-y;
    }
    ${ /*
      prevent drag of image instead of touch on firefox
    */``}
    img {
      user-select: none;
      ${ /*
      prevent weird overflow or margin. Try `block` if `flex` has weird behavior
    */``}
      display: flex;
    }
  `;
};
//# sourceMappingURL=prePaginatedReadingItem.js.map