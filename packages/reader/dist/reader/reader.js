import { Subject } from "rxjs";
import { Report } from "../report";
import { createContext as createBookContext } from "./context";
import { normalizeEventPositions } from "./frames";
import { getPercentageEstimate } from "./navigation";
import { createPagination } from "./pagination";
import { createReadingOrderView } from "./readingOrderView";
export const createReader = ({ containerElement }) => {
    const subject = new Subject();
    let context;
    let pagination;
    const element = createWrapperElement(containerElement);
    const iframeEventIntercept = createIframeMouseInterceptorElement(containerElement);
    let readingOrderView;
    let paginationSubscription$;
    element.appendChild(iframeEventIntercept);
    containerElement.appendChild(element);
    let context$;
    const layout = () => {
        const dimensions = {
            width: containerElement.offsetWidth,
            height: containerElement.offsetHeight,
        };
        let margin = 0;
        let marginTop = 0;
        let marginBottom = 0;
        let isReflow = true; // @todo
        const containerElementWidth = dimensions.width;
        const containerElementEvenWidth = containerElementWidth % 2 === 0 || isReflow
            ? containerElementWidth
            : containerElementWidth - 1; // @todo careful with the -1, dunno why it's here yet
        element.style.width = `${containerElementEvenWidth - 2 * margin}px`;
        element.style.height = `${dimensions.height - marginTop - marginBottom}px`;
        if (margin > 0 || marginTop > 0 || marginBottom > 0) {
            element.style.margin = `${marginTop}px ${margin}px ${marginBottom}px`;
        }
        const elementRect = element.getBoundingClientRect();
        context === null || context === void 0 ? void 0 : context.setVisibleAreaRect(elementRect.x, elementRect.y, containerElementEvenWidth, dimensions.height);
        readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.layout();
    };
    const goTo = (spineIndexOrIdOrCfi) => {
        readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.goTo(spineIndexOrIdOrCfi);
    };
    const load = (manifest, { fetchResource = 'http' } = {
        fetchResource: `http`
    }, spineIndexOrIdOrCfi) => {
        if (context) {
            Report.warn(`loading a new book is not supported yet`);
            return;
        }
        Report.log(`load`, { manifest, spineIndexOrIdOrCfi });
        context = createBookContext(manifest);
        context$ = context.$.subscribe(data => {
            if (data.event === 'iframe') {
                subject.next(data);
            }
        });
        pagination = createPagination({ context });
        readingOrderView = createReadingOrderView({ manifest: manifest, containerElement: element, context, pagination, options: { fetchResource } });
        readingOrderView.load();
        layout();
        // @todo support navigating through specific reading item & position
        // this will trigger every layout needed from this point. This allow user to start navigating
        // through the book even before other chapter are ready
        // readingOrderView.moveTo(20)
        goTo(spineIndexOrIdOrCfi || 0);
        paginationSubscription$ === null || paginationSubscription$ === void 0 ? void 0 : paginationSubscription$.unsubscribe();
        paginationSubscription$ = pagination.$.subscribe(({ event }) => {
            switch (event) {
                case 'change':
                    return subject.next({ event: 'paginationChange' });
            }
        });
        subject.next({ event: 'ready' });
    };
    /**
     * Free up resources, and dispose the whole reader.
     * You should call this method if you leave the reader.
     *
     * This is not possible to use any of the reader features once it
     * has been destroyed. If you need to open a new book you need to
     * either create a new reader or call `load` with a different manifest
     * instead of destroying it.
     */
    const destroy = () => {
        readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.destroy();
        paginationSubscription$ === null || paginationSubscription$ === void 0 ? void 0 : paginationSubscription$.unsubscribe();
        context$ === null || context$ === void 0 ? void 0 : context$.unsubscribe();
        element.remove();
        iframeEventIntercept.remove();
    };
    const publicApi = {
        turnLeft: () => {
            return readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.turnLeft();
        },
        turnRight: () => {
            return readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.turnRight();
        },
        goTo,
        goToPageOfCurrentChapter: (pageIndex) => {
            return readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.goToPageOfCurrentChapter(pageIndex);
        },
        goToNextSpineItem: () => {
            const currentSpineIndex = (readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.getSpineItemIndex()) || 0;
            const numberOfSpineItems = (context === null || context === void 0 ? void 0 : context.manifest.readingOrder.length) || 1;
            if (currentSpineIndex < (numberOfSpineItems - 1)) {
                goTo(currentSpineIndex + 1);
            }
        },
        goToPreviousSpineItem: () => {
            const currentSpineIndex = (readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.getSpineItemIndex()) || 0;
            if (currentSpineIndex > 0) {
                goTo(currentSpineIndex - 1);
            }
        },
        getPagination() {
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
                    spineItemIndex: readingOrderView.getSpineItemIndex(),
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
                // hasNextChapter: (readingOrderView.spineItemIndex || 0) < (manifest.readingOrder.length - 1),
                // hasPreviousChapter: (readingOrderView.spineItemIndex || 0) < (manifest.readingOrder.length - 1),
                numberOfSpineItems: context.manifest.readingOrder.length
            };
        },
        normalizeEventPositions: (e) => {
            if (e.target !== iframeEventIntercept) {
                return e;
            }
            if (!context || !pagination)
                return e;
            return Object.assign({}, normalizeEventPositions(context, pagination, e, readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.getFocusedReadingItem()));
        },
        layout,
        load,
        destroy,
        isSelecting: () => readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.isSelecting(),
        getSelection: () => readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.getSelection(),
        $: subject.asObservable()
    };
    return publicApi;
};
const createWrapperElement = (containerElement) => {
    const element = containerElement.ownerDocument.createElement('div');
    element.id = 'BookView';
    element.style.setProperty(`overflow`, `hidden`);
    element.style.setProperty(`position`, `relative`);
    return element;
};
const createIframeMouseInterceptorElement = (containerElement) => {
    const iframeEventIntercept = containerElement.ownerDocument.createElement('div');
    iframeEventIntercept.id = `BookViewIframeEventIntercept`;
    iframeEventIntercept.style.cssText = `
    position: absolute;
    height: 100%;
    width: 100%;
  `;
    return iframeEventIntercept;
};
//# sourceMappingURL=reader.js.map