import { getItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages } from "../pagination";
import { getRangeFromNode } from "../utils/dom";
export const createLocator = ({ context }) => {
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
    return {
        getReadingItemOffsetFromCfi,
        getReadingItemOffsetFromPageIndex,
        getReadingItemOffsetFromAnchor,
    };
};
//# sourceMappingURL=locator.js.map