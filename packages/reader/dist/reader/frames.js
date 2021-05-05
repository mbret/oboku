export const normalizeEventPositions = (context, pagination, e, readingItem) => {
    // debugger
    return Object.assign(Object.assign({ 
        // ...e,
        x: 0 }, `clientX` in e && {
        clientX: e.clientX,
    }), `x` in e && {
        x: translateFramePositionIntoPage(context, pagination, { x: e.x, y: e.y }, readingItem).x
    });
};
export const translateFramePositionIntoPage = (context, pagination, position, readingItem) => {
    const { left: iframeLeft = 0, width: iframeWidth = 0 } = (readingItem === null || readingItem === void 0 ? void 0 : readingItem.getFrameLayoutInformation()) || {};
    const { computedScale = 1 } = (readingItem === null || readingItem === void 0 ? void 0 : readingItem.getViewPortInformation()) || {};
    const pageSize = context.getPageSize();
    const numberOfPages = pagination.getNumberOfPages() || 0;
    const pageIndex = pagination.getPageIndex() || 0;
    const scaledX = position.x * computedScale;
    const offsetAdjustedX = Math.max(0, iframeLeft + scaledX);
    return {
        x: offsetAdjustedX > pageSize.width
            ? context.isRTL()
                ? offsetAdjustedX - (pageSize.width * ((numberOfPages - 1) - pageIndex))
                : offsetAdjustedX - (pageSize.width * pageIndex)
            : offsetAdjustedX,
    };
};
//# sourceMappingURL=frames.js.map