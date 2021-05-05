var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EMPTY, interval, Subject } from "rxjs";
import { catchError, debounce, filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { Report } from "../report";
import { translateFramePositionIntoPage } from "./frames";
import { buildChapterInfoFromReadingItem } from "./navigation";
import { createNavigator } from "./navigator";
import { createReadingItem } from "./readingItem";
import { createReadingItemManager } from "./readingItemManager";
export const createReadingOrderView = ({ manifest, containerElement, context, pagination }) => {
    const subject = new Subject();
    const doc = containerElement.ownerDocument;
    const readingItemManager = createReadingItemManager({ context });
    const element = createElement(doc);
    containerElement.appendChild(element);
    const navigator = createNavigator({ context, pagination, readingItemManager, element });
    let selectionSubscription;
    let readingItemManagerSubscription;
    let focusedReadingItemSubscription;
    const contextSubscription = context.$.subscribe(data => {
        if (data.event === 'linkClicked') {
            const hrefUrl = new URL(data.data.href);
            const hrefWithoutAnchor = `${hrefUrl.origin}${hrefUrl.pathname}`;
            // internal link, we can handle
            const hasExistingSpineItem = context.manifest.readingOrder.some(item => item.href === hrefWithoutAnchor);
            if (hasExistingSpineItem) {
                navigator.goTo(hrefUrl);
            }
        }
    });
    const layout = () => {
        readingItemManager.layout();
    };
    const load = () => {
        manifest.readingOrder.map((resource) => __awaiter(void 0, void 0, void 0, function* () {
            const readingItem = createReadingItem({
                item: resource,
                containerElement: element,
                context,
            });
            readingItemManager.add(readingItem);
        }));
    };
    readingItemManagerSubscription = readingItemManager.$.pipe(tap((event) => {
        if (event.event === 'layout') {
            navigator.adjustReadingOffsetPosition({ shouldAdjustCfi: false });
        }
        if (event.event === 'focus') {
            const readingItem = event.data;
            const fingerTracker$ = readingItem.fingerTracker.$;
            const selectionTracker$ = readingItem.selectionTracker.$;
            if (readingItem.getIsReady()) {
                // @todo maybe we need to adjust cfi here ? it should be fine since if it's already
                // ready then the navigation should have caught the right cfi, if not the observable
                // will catch it
            }
            focusedReadingItemSubscription === null || focusedReadingItemSubscription === void 0 ? void 0 : focusedReadingItemSubscription.unsubscribe();
            focusedReadingItemSubscription = readingItem.$.pipe(tap(event => {
                if (event.event === 'layout' && event.data.isFirstLayout && event.data.isReady) {
                    navigator.adjustReadingOffsetPosition({ shouldAdjustCfi: true });
                }
            }), catchError(e => {
                Report.error(e);
                return EMPTY;
            })).subscribe();
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
    }), catchError(e => {
        Report.error(e);
        return EMPTY;
    })).subscribe();
    return Object.assign(Object.assign({}, navigator), { readingItemManager, goToNextSpineItem: () => {
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
        getChapterInfo() {
            const item = readingItemManager.getFocusedReadingItem();
            return item && buildChapterInfoFromReadingItem(manifest, item);
        }, destroy: () => {
            readingItemManager.destroy();
            readingItemManagerSubscription === null || readingItemManagerSubscription === void 0 ? void 0 : readingItemManagerSubscription.unsubscribe();
            selectionSubscription === null || selectionSubscription === void 0 ? void 0 : selectionSubscription.unsubscribe();
            focusedReadingItemSubscription === null || focusedReadingItemSubscription === void 0 ? void 0 : focusedReadingItemSubscription.unsubscribe();
            contextSubscription.unsubscribe();
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