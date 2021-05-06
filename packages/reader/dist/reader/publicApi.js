import { Report } from "../report";
import { normalizeEventPositions } from "./frames";
import { getPercentageEstimate } from "./navigation";
export const createPublicApi = (reader) => {
    const goToNextSpineItem = () => {
        var _a, _b, _c;
        const currentSpineIndex = ((_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.readingItemManager.getFocusedReadingItemIndex()) || 0;
        const numberOfSpineItems = ((_b = reader.getContext()) === null || _b === void 0 ? void 0 : _b.manifest.readingOrder.length) || 1;
        if (currentSpineIndex < (numberOfSpineItems - 1)) {
            (_c = reader.getReadingOrderView()) === null || _c === void 0 ? void 0 : _c.goTo(currentSpineIndex + 1);
        }
    };
    const goToPreviousSpineItem = () => {
        var _a, _b;
        const currentSpineIndex = ((_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.readingItemManager.getFocusedReadingItemIndex()) || 0;
        if (currentSpineIndex > 0) {
            (_b = reader.getReadingOrderView()) === null || _b === void 0 ? void 0 : _b.goTo(currentSpineIndex - 1);
        }
    };
    return {
        layout: reader.layout,
        load: reader.load,
        destroy: reader.destroy,
        $: reader.$,
        turnLeft: () => {
            var _a;
            return (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.turnLeft();
        },
        turnRight: () => {
            var _a;
            return (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.turnRight();
        },
        goTo: (spineIndexOrIdOrCfi) => {
            var _a;
            (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.goTo(spineIndexOrIdOrCfi);
        },
        goToPath: (path) => {
            var _a, _b;
            const manifest = (_a = reader.getContext()) === null || _a === void 0 ? void 0 : _a.manifest;
            const foundItem = manifest === null || manifest === void 0 ? void 0 : manifest.readingOrder.find(item => item.path === path);
            if (foundItem) {
                (_b = reader.getReadingOrderView()) === null || _b === void 0 ? void 0 : _b.goTo(foundItem.id);
            }
        },
        goToPageOfCurrentChapter: (pageIndex) => {
            var _a;
            return (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.goToPageOfCurrentChapter(pageIndex);
        },
        goToNextSpineItem,
        goToPreviousSpineItem,
        goToLeftSpineItem: () => {
            var _a;
            if ((_a = reader.getContext()) === null || _a === void 0 ? void 0 : _a.isRTL()) {
                return goToNextSpineItem();
            }
            return goToPreviousSpineItem();
        },
        goToRightSpineItem: () => {
            var _a;
            if ((_a = reader.getContext()) === null || _a === void 0 ? void 0 : _a.isRTL()) {
                return goToPreviousSpineItem();
            }
            return goToNextSpineItem();
        },
        getPagination() {
            var _a;
            const pagination = reader.getPagination();
            const readingOrderView = reader.getReadingOrderView();
            const context = reader.getContext();
            const readingItemManager = (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.readingItemManager;
            if (!readingOrderView || !pagination || !context)
                return undefined;
            return {
                begin: {
                    // chapterIndex: number;
                    chapterInfo: readingOrderView.getChapterInfo(),
                    pageIndexInChapter: pagination.getPageIndex(),
                    numberOfPagesInChapter: pagination.getNumberOfPages(),
                    // pages: number;
                    // pageIndexInBook: number;
                    // pageIndexInChapter: number;
                    // pagesOfChapter: number;
                    // pagePercentageInChapter: number;
                    // offsetPercentageInChapter: number;
                    // domIndex: number;
                    // charOffset: number;
                    // serializeString?: string;
                    spineItemIndex: readingItemManager === null || readingItemManager === void 0 ? void 0 : readingItemManager.getFocusedReadingItemIndex(),
                    cfi: pagination.getCfi(),
                },
                // end: ReadingLocation;
                /**
                 * This percentage is based of the weight (kb) of every items and the number of pages.
                 * It is not accurate but gives a general good idea of the overall progress.
                 * It is recommended to use this progress only for reflow books. For pre-paginated books
                 * the number of pages and current index can be used instead since 1 page = 1 chapter.
                 */
                percentageEstimateOfBook: getPercentageEstimate(context, readingOrderView, pagination),
                pagesOfBook: Infinity,
                // chaptersOfBook: number;
                // chapter: string;
                // hasNextChapter: (reader.getReadingOrderView().spineItemIndex || 0) < (manifest.readingOrder.length - 1),
                // hasPreviousChapter: (reader.getReadingOrderView().spineItemIndex || 0) < (manifest.readingOrder.length - 1),
                numberOfSpineItems: context.manifest.readingOrder.length
            };
        },
        getEventInformation: Report.measurePerformance(`getEventInformation`, 10, (e) => {
            var _a;
            const { iframeEventBridgeElement, iframeEventBridgeElementLastContext } = reader.getIframeEventBridge();
            const readingItemManager = (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.readingItemManager;
            const pagination = reader.getPagination();
            const context = reader.getContext();
            const normalizedEventPointerPositions = Object.assign(Object.assign({}, `clientX` in e && {
                clientX: e.clientX,
            }), `x` in e && {
                x: e.x
            });
            if (e.target !== iframeEventBridgeElement) {
                return { event: e, normalizedEventPointerPositions };
            }
            if (!context || !pagination)
                return { event: e, normalizedEventPointerPositions };
            return {
                event: e,
                iframeOriginalEvent: iframeEventBridgeElementLastContext === null || iframeEventBridgeElementLastContext === void 0 ? void 0 : iframeEventBridgeElementLastContext.event,
                normalizedEventPointerPositions: normalizeEventPositions(context, pagination, e, readingItemManager === null || readingItemManager === void 0 ? void 0 : readingItemManager.getFocusedReadingItem())
            };
        }),
        isSelecting: () => { var _a; return (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.isSelecting(); },
        getSelection: () => { var _a; return (_a = reader.getReadingOrderView()) === null || _a === void 0 ? void 0 : _a.getSelection(); },
        getManifest: () => { var _a; return (_a = reader.getContext()) === null || _a === void 0 ? void 0 : _a.manifest; },
    };
};
//# sourceMappingURL=publicApi.js.map