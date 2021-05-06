export const buildChapterInfoFromReadingItem = (manifest, readingItem) => {
    const { path } = readingItem.item;
    return getChapterInfo(path, manifest.nav.toc);
};
const getChapterInfo = (path, tocItems) => {
    return tocItems.reduce((acc, tocItem) => {
        const indexOfHash = tocItem.path.indexOf('#');
        const tocItemPathWithoutAnchor = indexOfHash > 0 ? tocItem.path.substr(0, indexOfHash) : tocItem.path;
        if (path.endsWith(tocItemPathWithoutAnchor)) {
            return {
                title: tocItem.title,
                path: tocItem.path
            };
        }
        const subInfo = getChapterInfo(path, tocItem.contents);
        if (subInfo) {
            return {
                subChapter: subInfo,
                title: tocItem.title,
                path: tocItem.path
            };
        }
        return acc;
    }, undefined);
};
export const getPercentageEstimate = (context, readingOrderView, pagination) => {
    var _a;
    const currentSpineIndex = readingOrderView.readingItemManager.getFocusedReadingItemIndex() || 0;
    const numberOfPages = pagination.getNumberOfPages();
    const currentPageIndex = pagination.getPageIndex() || 0;
    const estimateBeforeThisItem = context.manifest.readingOrder
        .slice(0, currentSpineIndex)
        .reduce((acc, item) => acc + item.progressionWeight, 0);
    const currentItemWeight = ((_a = context.manifest.readingOrder[currentSpineIndex]) === null || _a === void 0 ? void 0 : _a.progressionWeight) || 0;
    // const nextItem = context.manifest.readingOrder[currentSpineIndex + 1]
    // const nextItemWeight = nextItem ? nextItem.progressionWeight : 1
    // const progressWeightGap = (currentItemWeight + estimateBeforeThisItem) - estimateBeforeThisItem
    const progressWithinThisItem = (currentPageIndex + 1) * (currentItemWeight / numberOfPages);
    const totalProgress = estimateBeforeThisItem + progressWithinThisItem;
    // because the rounding of weight use a lot of decimals we will end up with
    // something like 0.999878 for the last page
    if ((currentSpineIndex === context.manifest.readingOrder.length - 1) && (currentPageIndex === numberOfPages - 1)) {
        return 1;
    }
    return totalProgress;
};
//# sourceMappingURL=navigation.js.map