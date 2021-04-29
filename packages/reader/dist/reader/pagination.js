import { Subject } from "rxjs";
import { Report } from "../report";
export const createPagination = ({ context }) => {
    const subject = new Subject();
    let pageIndex;
    let numberOfPages = 0;
    let isAtEndOfChapter = false;
    let cfi = undefined;
    const calculateClosestOffsetFromPage = (pageIndex, readingItem) => {
        var _a;
        const itemWidth = (((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0);
        const lastPageOffset = itemWidth - context.getPageSize().width;
        const logicalOffset = (itemWidth * (pageIndex * context.getPageSize().width)) / itemWidth;
        return Math.max(0, Math.min(lastPageOffset, logicalOffset));
    };
    return {
        getPageIndex() {
            return pageIndex;
        },
        getNumberOfPages() {
            return numberOfPages;
        },
        getIsAtEndOfChapter() {
            return isAtEndOfChapter;
        },
        update: (readingItem, offsetInReadingItem, options = {}) => {
            var _a;
            const readingItemWidth = ((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0;
            const pageWidth = context.getPageSize().width;
            numberOfPages = getNumberOfPages(readingItemWidth, context.getPageSize().width);
            pageIndex = getPageFromOffset(offsetInReadingItem, pageWidth, numberOfPages);
            // console.log(`Pagination`, `update with ${offsetInReadingItem}`, { readingItemWidth, pageIndex, numberOfPages })
            isAtEndOfChapter = readingItem.isContentReady() && pageIndex === (numberOfPages - 1);
            if (options.isAtEndOfChapter !== undefined) {
                isAtEndOfChapter = options.isAtEndOfChapter;
            }
            // @todo update pagination cfi whenever iframe is ready (cause even offset may not change but we still need to get the iframe for cfi)
            // @todo update cfi also whenever a resize occurs in the iframe
            // - load
            // - font loaded
            // - resize
            // future changes would potentially only be resize (easy to track) and font size family change.
            // to track that we can have a hidden text element and track it and send event back
            cfi = readingItem.getCfi(offsetInReadingItem);
            Report.log(`pagination`, `cfi`, cfi);
            // Report.log(`pagination`, `cfi resolve`, readingItem.resolveCfi(cfi))
            // if (!!doc) {
            //   const s = readingItem.getFirstNodeAtOffset(offsetInReadingItem)
            //   if (s) {
            //     // const cfi = CFI.generate(readingItem.getFirstNodeAtOffset(), 0, `[${readingItem.item.id}]`)
            //     // const cfi = CFI.generate(s)
            //     // const cfi = `epubcfi(/6/4[spi_ad]!/4/1:0)`
            //     // const cfi = `epubcfi(/6/4)`
            //     // const cfi = `epubcfi(/4/2)`
            //     const cfi = `epubcfi(/2)`
            //     console.log(s, cfi, CFI.generate(s))
            //     const newCfi = new CFI(CFI.generate(s), {})
            //     // const newCfi = new CFI('epubcfi(/6/4[spi_ad]!/4/1:0)')
            //     console.log(newCfi)
            //     // console.log(doc)
            //     // setTimeout(() => {
            //     // console.log(newCfi.res(doc, newCfi.parts))
            //     // console.log(newCfi.resolveURI(0, doc))
            //     newCfi.resolve(doc, () => doc, {}).then((r) => {
            //       console.log(`located node`, r.node)
            //     }).catch(console.error)
            //     // }, 1000)
            //   }
            // }
            subject.next({ event: 'change' });
        },
        getCfi() {
            return cfi;
        },
        getClosestValidOffsetFromOffset: (offsetInReadingItem, readingItem) => {
            var _a;
            const readingItemWidth = ((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0;
            const pageWidth = context.getPageSize().width;
            const numberOfPages = getNumberOfPages(readingItemWidth, context.getPageSize().width);
            // console.log(`calculatePageFromOffset`, { readingItemWidth, pageWidth, numberOfPages })
            return getClosestValidOffsetFromOffset(offsetInReadingItem, pageWidth, numberOfPages);
        },
        calculateClosestOffsetFromPage,
        $: subject.asObservable()
    };
};
const getNumberOfPages = (readingItemWidth, pageWidth) => {
    if (pageWidth === 0)
        return 1;
    return readingItemWidth / pageWidth;
};
const getPageFromOffset = (offset, pageWidth, numberOfPages) => {
    const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth);
    return Math.max(0, offsetValues.findIndex(offsetRange => offset < (offsetRange + pageWidth)));
};
const getClosestValidOffsetFromOffset = (offset, pageWidth, numberOfPages) => {
    const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth);
    return offsetValues.find(offsetRange => offset < (offsetRange + pageWidth)) || 0;
};
//# sourceMappingURL=pagination.js.map