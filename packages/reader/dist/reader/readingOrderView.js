var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { interval, Subject } from "rxjs";
import { debounce, filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { translateFramePositionIntoPage } from "./frames";
import { buildChapterInfoFromReadingItem } from "./navigation";
import { createNavigator } from "./navigator";
import { createReadingItem } from "./readingItem";
import { createReadingItemManager } from "./readingItemManager";
export const createReadingOrderView = ({ manifest, containerElement, context, pagination, options }) => {
    const subject = new Subject();
    const doc = containerElement.ownerDocument;
    const readingItemManager = createReadingItemManager({ context });
    const element = createElement(doc);
    containerElement.appendChild(element);
    const navigator = createNavigator({ context, pagination, readingItemManager, element });
    let selectionSubscription;
    let readingItemManagerSubscription;
    const layout = () => {
        readingItemManager.layout();
    };
    const load = () => {
        manifest.readingOrder.map((resource) => __awaiter(void 0, void 0, void 0, function* () {
            const readingItem = createReadingItem({
                item: resource,
                containerElement: element,
                context,
                fetchResource: options.fetchResource
            });
            readingItemManager.add(readingItem);
        }));
    };
    readingItemManagerSubscription = readingItemManager.$.subscribe((event) => {
        if (event.event === 'layout') {
            const focusedItem = readingItemManager.getFocusedReadingItem();
            const newOffset = navigator.adjustPositionForCurrentPagination();
            if (focusedItem && newOffset !== undefined) {
                const readingItemOffset = navigator.getOffsetInCurrentReadingItem(newOffset, focusedItem);
                /**
                 * There are two reason we need to update pagination here
                 * - after a layout change, pagination needs to be aware of new item dimensions to calculate correct number of pages, ...
                 * - after a layout change, offset can be desynchronized and we need to let pagination knows the new offset.
                 * The new offset could have a different page number because there are less page now, etc.
                 */
                focusedItem && pagination.update(focusedItem, readingItemOffset);
            }
        }
        if (event.event === 'focus') {
            const readingItem = event.data;
            const fingerTracker$ = readingItem.fingerTracker.$;
            const selectionTracker$ = readingItem.selectionTracker.$;
            selectionSubscription === null || selectionSubscription === void 0 ? void 0 : selectionSubscription.unsubscribe();
            selectionSubscription = selectionTracker$
                .pipe(filter(({ event }) => event === 'selectstart'))
                .pipe(switchMap(_ => fingerTracker$
                .pipe(filter(({ event }) => event === 'fingermove'), debounce(() => interval(1000)), takeUntil(fingerTracker$
                .pipe(filter(({ event }) => event === 'fingerout'), tap(() => {
            }))), tap(({ data }) => {
                if (data) {
                    const fingerPosition = translateFramePositionIntoPage(context, pagination, data, readingItem);
                    if (fingerPosition.x >= context.getPageSize().width) {
                        navigator.turnRight({ allowReadingItemChange: false });
                    }
                    else if (fingerPosition.x <= context.getPageSize().width) {
                        navigator.turnLeft({ allowReadingItemChange: false });
                    }
                }
            }))))
                .subscribe();
        }
    });
    const getFocusedReadingItem = () => readingItemManager.getFocusedReadingItem();
    return Object.assign(Object.assign({}, navigator), { goToNextSpineItem: () => {
            const currentSpineIndex = readingItemManager.getFocusedReadingItemIndex() || 0;
            const numberOfSpineItems = (context === null || context === void 0 ? void 0 : context.manifest.readingOrder.length) || 1;
            if (currentSpineIndex < (numberOfSpineItems - 1)) {
                navigator.goTo(currentSpineIndex + 1);
            }
        }, goToPreviousSpineItem: () => {
            const currentSpineIndex = readingItemManager.getFocusedReadingItemIndex() || 0;
            if (currentSpineIndex > 0) {
                navigator.goTo(currentSpineIndex - 1);
            }
        }, load,
        layout,
        getFocusedReadingItem,
        getChapterInfo() {
            const item = readingItemManager.getFocusedReadingItem();
            return item && buildChapterInfoFromReadingItem(manifest, item);
        },
        getSpineItemIndex() {
            return readingItemManager.getFocusedReadingItemIndex();
        }, destroy: () => {
            readingItemManager.destroy();
            readingItemManagerSubscription === null || readingItemManagerSubscription === void 0 ? void 0 : readingItemManagerSubscription.unsubscribe();
            selectionSubscription === null || selectionSubscription === void 0 ? void 0 : selectionSubscription.unsubscribe();
            element.remove();
        }, isSelecting: () => { var _a; return (_a = readingItemManager.getFocusedReadingItem()) === null || _a === void 0 ? void 0 : _a.selectionTracker.isSelecting(); }, getSelection: () => { var _a; return (_a = readingItemManager.getFocusedReadingItem()) === null || _a === void 0 ? void 0 : _a.selectionTracker.getSelection(); }, $: subject });
};
const createElement = (doc) => {
    const element = doc.createElement('div');
    element.id = 'ReadingOrderView';
    element.className = 'ReadingOrderView';
    element.style.height = `100%`;
    element.style.willChange = `transform`;
    element.style.transformOrigin = `0 0`;
    return element;
};
//# sourceMappingURL=readingOrderView.js.map