import { getItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages } from "../pagination";
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
    const getReadingItemOffsetFromPageIndex = (pageIndex, readingItem) => {
        var _a;
        const itemWidth = (((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0);
        return getItemOffsetFromPageIndex(context.getPageSize().width, pageIndex, itemWidth);
    };
    const getReadingItemOffsetFromAnchor = (anchor, readingItem) => {
        var _a;
        const itemWidth = (((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0);
        const pageWidth = context.getPageSize().width;
        const anchorElementBoundingRect = readingItem.getBoundingRectOfElementFromSelector(anchor);
        // @todo writing-direction
        const offsetOfAnchor = (anchorElementBoundingRect === null || anchorElementBoundingRect === void 0 ? void 0 : anchorElementBoundingRect.x) || 0;
        return getClosestValidOffsetFromApproximateOffsetInPages(offsetOfAnchor, pageWidth, itemWidth);
    };
    const getReadingItemOffsetFromCfi = (cfi, readingItem) => {
        var _a;
        const { node, offset = 0 } = readingItem.resolveCfi(cfi) || {};
        // @todo writing-direction
        let offsetOfNodeInReadingItem = 0;
        // for some reason `img` does not work with range (x always = 0)
        if ((node === null || node === void 0 ? void 0 : node.nodeName) === `img`) {
            offsetOfNodeInReadingItem = node.getBoundingClientRect().x;
        }
        else {
            const range = node ? getRangeFromNode(node, offset) : undefined;
            offsetOfNodeInReadingItem = (range === null || range === void 0 ? void 0 : range.getBoundingClientRect().x) || offsetOfNodeInReadingItem;
        }
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
    return {
        getReadingOrderViewOffsetFromReadingItemOffset,
        getReadingItemOffsetFromReadingOrderViewOffset,
        getReadingItemOffsetFromCfi,
        getReadingItemOffsetFromPageIndex,
        getReadingItemOffsetFromAnchor,
    };
};
//# sourceMappingURL=locator.js.map