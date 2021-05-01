import { Subject } from "rxjs";
import { Report } from "../report";
import { createContext as createBookContext } from "./context";
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
        readingOrderView = createReadingOrderView({
            manifest: manifest,
            containerElement: element,
            context,
            pagination,
            options: { fetchResource }
        });
        readingOrderView.load();
        // @todo support navigating through specific reading item & position
        // this will trigger every layout needed from this point. This allow user to start navigating
        // through the book even before other chapter are ready
        // readingOrderView.moveTo(20)
        readingOrderView === null || readingOrderView === void 0 ? void 0 : readingOrderView.goTo(spineIndexOrIdOrCfi || 0);
        layout();
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
        getReadingOrderView: () => readingOrderView,
        getContext: () => context,
        getPagination: () => pagination,
        getIframeEventIntercept: () => iframeEventIntercept,
        layout,
        load,
        destroy,
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