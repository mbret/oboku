export const buildChapterInfoFromReadingItem = (manifest, readingItem) => {
    const { path } = readingItem.item;
    return getChapterInfo(path, manifest.nav.toc);
};
const getChapterInfo = (path, tocItems) => {
    return tocItems.reduce((acc, item) => {
        const itemPathWithoutAnchor = item.path.substr(0, item.path.indexOf('#'));
        if (path.endsWith(itemPathWithoutAnchor)) {
            return {
                title: item.title
            };
        }
        const subInfo = getChapterInfo(path, item.contents);
        if (subInfo) {
            return {
                subChapter: subInfo,
                title: item.title
            };
        }
        return acc;
    }, undefined);
};
export const getPercentageEstimate = (context, readingOrderView, pagination) => {
    var _a;
    const currentSpineIndex = readingOrderView.getSpineItemIndex() || 0;
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
    // console.log({currentPageIndex, progressWeightGap, nextItemWeight, estimateToThisItem: estimateBeforeThisItem}, pagination.getNumberOfPages())
    const totalProgress = estimateBeforeThisItem + progressWithinThisItem;
    // because the rounding of weight use a lot of decimals we will end up with
    // something like 0.999878 for the last page
    if ((currentSpineIndex === context.manifest.readingOrder.length - 1) && (currentPageIndex === numberOfPages - 1)) {
        return 1;
    }
    return totalProgress;
};
//# sourceMappingURL=navigation.js.map