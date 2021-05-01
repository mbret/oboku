import { getReadingItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages } from "../pagination";
import { getRangeFromNode } from "../utils/dom";
export const createLocator = ({ readingItemManager, context }) => {
    const getReadingItemOffsetFromReadingOrderViewOffset = (readingOrderViewOffset, readingItem) => {
        const { end, start } = readingItemManager.getPositionOf(readingItem);
        const itemReadingDirection = readingItem.getReadingDirection();
        /**
         * For this case the global offset move from right to left but this specific item
         * reads from left to right. This means that when the offset is at the start of the item
         * it is in fact at his end. This behavior can be observed in `haruko` about chapter.
         * @example
         * <---------------------------------------------------- global offset
         * item offset ------------------>
         * [item2 (page0 - page1 - page2)] [item1 (page1 - page0)] [item0 (page0)]
         */
        if (context.isRTL() && itemReadingDirection === 'ltr') {
            return (end - readingOrderViewOffset) - context.getPageSize().width;
        }
        return readingOrderViewOffset - start;
    };
    const getReadingItemOffsetFromCfi = (cfi, readingItem) => {
        var _a;
        const { node, offset = 0 } = readingItem.resolveCfi(cfi) || {};
        const range = node ? getRangeFromNode(node, offset) : undefined;
        const offsetOfNodeInReadingItem = (range === null || range === void 0 ? void 0 : range.getBoundingClientRect().x) || 0;
        const readingItemWidth = ((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0;
        const pageWidth = context.getPageSize().width;
        return getClosestValidOffsetFromApproximateOffsetInPages(offsetOfNodeInReadingItem, pageWidth, readingItemWidth);
    };
    const getReadingOrderViewOffsetFromReadingItemOffset = (readingItemOffset, readingItem) => {
        const { end, start } = readingItemManager.getPositionOf(readingItem);
        const itemReadingDirection = readingItem.getReadingDirection();
        /**
         * For this case the global offset move from right to left but this specific item
         * reads from left to right. This means that when the offset is at the start of the item
         * it is in fact at his end. This behavior can be observed in `haruko` about chapter.
         * @example
         * <---------------------------------------------------- global offset
         * item offset ------------------>
         * [item2 (page0 - page1 - page2)] [item1 (page1 - page0)] [item0 (page0)]
         */
        if (context.isRTL() && itemReadingDirection === 'ltr') {
            return (end - readingItemOffset) - context.getPageSize().width;
        }
        return start + readingItemOffset;
    };
    const getReadingOrderViewOffsetFromReadingItemPage = (pageIndex, readingItem) => {
        var _a;
        const itemWidth = (((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0);
        const readingItemOffset = getReadingItemOffsetFromPageIndex(context.getPageSize().width, pageIndex, itemWidth);
        return getReadingOrderViewOffsetFromReadingItemOffset(readingItemOffset, readingItem);
    };
    return {
        getReadingOrderViewOffsetFromReadingItemPage,
        getReadingOrderViewOffsetFromReadingItemOffset,
        getReadingItemOffsetFromReadingOrderViewOffset,
        getReadingItemOffsetFromCfi,
    };
};
//# sourceMappingURL=locator.js.map