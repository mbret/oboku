import { Report } from "../../report";
import { extractObokuMetadataFromCfi } from "../cfi";
import { getNumberOfPages } from "../pagination";
import { createLocator } from "./locator";
const NAMESPACE = `navigator`;
export const createNavigator = ({ readingItemManager, context, pagination, element }) => {
    const locator = createLocator({ context, readingItemManager });
    let lastUserExpectedNavigation = undefined;
    const adjustReadingOffset = (offset) => {
        if (context.isRTL()) {
            element.style.transform = `translateX(${offset}px)`;
        }
        else {
            element.style.transform = `translateX(-${offset}px)`;
        }
    };
    const getCurrentOffset = () => Math.floor(Math.abs(element.getBoundingClientRect().x));
    const turnLeft = Report.measurePerformance(`${NAMESPACE} turnLeft`, 10, ({ allowReadingItemChange = true } = {}) => {
        const currentXoffset = getCurrentOffset();
        const nextPosition = context.isRTL()
            ? currentXoffset + context.getPageSize().width
            : currentXoffset - context.getPageSize().width;
        navigateToOffsetOrCfi(nextPosition, { allowReadingItemChange });
    });
    const turnRight = Report.measurePerformance(`${NAMESPACE} turnRight`, 10, ({ allowReadingItemChange = true } = {}) => {
        const currentXoffset = getCurrentOffset();
        const nextPosition = context.isRTL()
            ? currentXoffset - context.getPageSize().width
            : currentXoffset + context.getPageSize().width;
        navigateToOffsetOrCfi(nextPosition, { allowReadingItemChange });
    });
    const goToPageOfCurrentChapter = (pageIndex) => {
        const readingItem = readingItemManager.getFocusedReadingItem();
        if (readingItem) {
            const newOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(locator.getReadingItemOffsetFromPageIndex(pageIndex, readingItem), readingItem);
            navigateToOffsetOrCfi(newOffset);
        }
    };
    /**
     * This method always starts from beginning of item unless a cfi is provided
     * or an url with anchor
     */
    const goTo = (spineIndexOrSpineItemIdOrPathCfi) => {
        let offsetOfReadingItem = undefined;
        // cfi
        if (typeof spineIndexOrSpineItemIdOrPathCfi === `string` && spineIndexOrSpineItemIdOrPathCfi.startsWith(`epubcfi`)) {
            navigateToOffsetOrCfi(spineIndexOrSpineItemIdOrPathCfi);
        }
        else if (typeof spineIndexOrSpineItemIdOrPathCfi === `string` || spineIndexOrSpineItemIdOrPathCfi instanceof URL) {
            // url
            let url;
            try {
                url = spineIndexOrSpineItemIdOrPathCfi instanceof URL ? spineIndexOrSpineItemIdOrPathCfi : new URL(spineIndexOrSpineItemIdOrPathCfi);
            }
            catch (e) {
                Report.error(e);
            }
            if (url) {
                const urlWithoutAnchor = `${url.origin}${url.pathname}`;
                const existingSpineItem = context.manifest.readingOrder.find(item => item.href === urlWithoutAnchor);
                if (existingSpineItem) {
                    const readingItem = readingItemManager.get(existingSpineItem.id);
                    if (readingItem) {
                        offsetOfReadingItem = readingItemManager.getPositionOf(readingItem).start;
                        navigateToOffsetOrCfi(offsetOfReadingItem || 0, { startOfReadingItem: true, anchor: url.hash });
                    }
                }
            }
        }
        else {
            // spine item id
            const readingItem = readingItemManager.get(spineIndexOrSpineItemIdOrPathCfi);
            offsetOfReadingItem = readingItem ? readingItemManager.getPositionOf(readingItem).start : 0;
            navigateToOffsetOrCfi(offsetOfReadingItem || 0, { startOfReadingItem: true });
        }
    };
    /**
     * @todo optimize this function to not being called several times
     */
    const navigateToOffsetOrCfi = (offsetOrCfi, { allowReadingItemChange, startOfReadingItem, anchor } = {}) => {
        let offset = typeof offsetOrCfi === `number` ? offsetOrCfi : 0;
        const latestReadingItem = readingItemManager.get(readingItemManager.getLength() - 1);
        const distanceOfLastReadingItem = readingItemManager.getPositionOf(latestReadingItem || 0);
        const maximumOffset = distanceOfLastReadingItem.end - context.getPageSize().width;
        const currentReadingItem = readingItemManager.getFocusedReadingItem();
        let potentialNewReadingItem = readingItemManager.getReadingItemAtOffset(offset) || readingItemManager.get(0);
        // prevent to go outside of edges
        if (offset < 0 || (offset > maximumOffset)) {
            Report.log(NAMESPACE, `navigateToOffsetOrCfi`, `prevent due to out of bound offset`);
            return;
        }
        /**
         * handle cfi case.
         * We lookup the offset of the correct reading item, then we try to lookup the node.
         * There is a high change the iframe is not ready yet. This is why the cfi will mostly
         * be adjusted later. At least we navigate and focus the right reading item
         */
        if (typeof offsetOrCfi === `string`) {
            const { itemId } = extractObokuMetadataFromCfi(offsetOrCfi);
            if (!itemId) {
                Report.warn(`ReadingOrderView`, `unable to extract item id from cfi ${offsetOrCfi}`);
            }
            else {
                const { itemId } = extractObokuMetadataFromCfi(offsetOrCfi);
                potentialNewReadingItem = (itemId ? readingItemManager.get(itemId) : undefined) || readingItemManager.get(0);
                if (potentialNewReadingItem) {
                    offset = locator.getReadingItemOffsetFromCfi(offsetOrCfi, potentialNewReadingItem);
                }
                else {
                    Report.warn(`ReadingOrderView`, `unable to detect item id from cfi ${offsetOrCfi}`);
                }
            }
        }
        const newReadingItem = potentialNewReadingItem !== currentReadingItem ? potentialNewReadingItem : currentReadingItem;
        const readingItemHasChanged = newReadingItem !== currentReadingItem;
        if (!newReadingItem)
            return;
        const newReadingItemIsBeforeCurrent = !readingItemManager.isAfter(newReadingItem, currentReadingItem || newReadingItem);
        if (readingItemHasChanged && allowReadingItemChange === false) {
            Report.log(NAMESPACE, `navigateToOffsetOrCfi`, `prevent due to changing reading item but it is not allowed`);
            return;
        }
        adjustReadingOffset(offset);
        const offsetInCurrentReadingItem = locator.getReadingItemOffsetFromReadingOrderViewOffset(offset, newReadingItem);
        if (anchor) {
            lastUserExpectedNavigation = { type: 'navigate-from-anchor', data: anchor };
        }
        else if (currentReadingItem !== undefined && readingItemHasChanged && newReadingItemIsBeforeCurrent && !startOfReadingItem) {
            lastUserExpectedNavigation = { type: 'turned-prev-chapter' };
        }
        else if (typeof offsetOrCfi === `string`) {
            lastUserExpectedNavigation = { type: 'navigate-from-cfi', data: offsetOrCfi };
        }
        else {
            lastUserExpectedNavigation = undefined;
        }
        if (readingItemHasChanged) {
            readingItemManager.focus(newReadingItem);
        }
        pagination.update(newReadingItem, offsetInCurrentReadingItem, {
            isAtEndOfChapter: false,
            shouldUpdateCfi: (lastUserExpectedNavigation === null || lastUserExpectedNavigation === void 0 ? void 0 : lastUserExpectedNavigation.type) !== 'navigate-from-cfi'
        });
        Report.log(NAMESPACE, `navigateToOffsetOrCfi`, `navigate success`, { readingItemHasChanged, newReadingItem, offset, offsetInCurrentReadingItem });
        readingItemManager.loadContents();
    };
    /**
     * Verify that current offset is within the current reading item and is at
     * desired pagination.
     * If it is not, then we adjust the offset.
     * The offset could be wrong in the case of there has been re-layout.
     * In this case we always need to make sure to be synchronized with pagination.
     * Pagination is in theory always right because when we move the offset we directly update
     * the pagination. It's after, when re-layout happens for various reason that the page can be at
     * the wrong offset
     * @todo this is being called a lot, try to optimize
     */
    const adjustReadingOffsetPosition = ({ shouldAdjustCfi }) => {
        const readingItem = readingItemManager.getFocusedReadingItem();
        if (!readingItem)
            return;
        const currentXoffset = getCurrentOffset();
        const lastCfi = pagination.getCfi();
        const pageWidth = context.getPageSize().width;
        let expectedReadingOrderViewOffset = currentXoffset;
        let offsetInReadingItem = 0;
        /**
         * When `navigate-from-cfi` we always try to retrieve offset from cfi node and navigate
         * to there
         */
        if ((lastUserExpectedNavigation === null || lastUserExpectedNavigation === void 0 ? void 0 : lastUserExpectedNavigation.type) === 'navigate-from-cfi') {
            offsetInReadingItem = locator.getReadingItemOffsetFromCfi(lastUserExpectedNavigation.data, readingItem);
            Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `navigate-from-cfi`, { cfi: lastUserExpectedNavigation.data });
        }
        else if ((lastUserExpectedNavigation === null || lastUserExpectedNavigation === void 0 ? void 0 : lastUserExpectedNavigation.type) === 'turned-prev-chapter') {
            /**
             * When `turned-prev-chapter` we always try to get the offset of the last page, that way
             * we ensure reader is always redirected to last page
             */
            const numberOfPages = getNumberOfPages(readingItem.getBoundingClientRect().width, pageWidth);
            offsetInReadingItem = locator.getReadingItemOffsetFromPageIndex(numberOfPages - 1, readingItem);
            Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `turned-prev-chapter`, {});
        }
        else if ((lastUserExpectedNavigation === null || lastUserExpectedNavigation === void 0 ? void 0 : lastUserExpectedNavigation.type) === 'navigate-from-anchor') {
            /**
             * When `navigate-from-anchor` we just stay on the current reading item and try to get
             * the offset of that anchor.
             */
            const anchor = lastUserExpectedNavigation.data;
            offsetInReadingItem = locator.getReadingItemOffsetFromAnchor(anchor, readingItem);
        }
        else if (lastCfi) {
            /**
             * When there is no last navigation then we first look for any existing CFI. If there is a cfi we try to retrieve
             * the offset and navigate the user to it
             */
            offsetInReadingItem = locator.getReadingItemOffsetFromCfi(lastCfi, readingItem);
            Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `use last cfi`);
        }
        else {
            /**
             * Last resort case, there is no CFI so we check the current page and try to navigate to the closest one
             */
            // @todo get x of first visible element and try to get the page for this element
            // using the last page is not accurate since we could have less pages
            const currentPageIndex = pagination.getPageIndex() || 0;
            offsetInReadingItem = locator.getReadingItemOffsetFromPageIndex(currentPageIndex, readingItem);
            Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `use guess strategy`, {});
        }
        expectedReadingOrderViewOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(offsetInReadingItem, readingItem);
        if (expectedReadingOrderViewOffset !== currentXoffset) {
            adjustReadingOffset(expectedReadingOrderViewOffset);
        }
        // because we adjusted the position, the offset may have changed and with it current page, etc
        // because this is an adjustment we do not want to update the cfi (anchor)
        // unless it has not been set yet or it is a basic /0 node
        const shouldUpdateCfi = lastCfi === undefined
            ? true
            : (lastCfi === null || lastCfi === void 0 ? void 0 : lastCfi.startsWith(`epubcfi(/0`)) || shouldAdjustCfi;
        pagination.update(readingItem, offsetInReadingItem, { shouldUpdateCfi, isAtEndOfChapter: false });
    };
    return {
        adjustOffset: adjustReadingOffset,
        getCurrentOffset,
        turnLeft,
        turnRight,
        goTo,
        goToPageOfCurrentChapter,
        adjustReadingOffsetPosition,
    };
};
//# sourceMappingURL=navigator.js.map