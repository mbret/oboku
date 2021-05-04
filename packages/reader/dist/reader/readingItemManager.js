import { Subject } from "rxjs";
import { Report } from "../report";
const NAMESPACE = `readingItemManager`;
export const createReadingItemManager = ({ context }) => {
    const subject = new Subject();
    let orderedReadingItems = [];
    let activeReadingItemIndex = undefined;
    const layout = () => {
        orderedReadingItems.reduce((edgeOffset, item) => {
            const { width } = item.layout();
            item.adjustPositionOfElement(edgeOffset);
            return width + edgeOffset;
        }, 0);
        subject.next({ event: 'layout' });
    };
    const adjustPositionOfItems = () => {
        orderedReadingItems.reduce((edgeOffset, item) => {
            const itemWidth = item.getBoundingClientRect().width;
            item.adjustPositionOfElement(edgeOffset);
            return itemWidth + edgeOffset;
        }, 0);
        subject.next({ event: 'layout' });
    };
    const focus = (indexOrReadingItem) => {
        const readingItemToFocus = typeof indexOrReadingItem === `number` ? get(indexOrReadingItem) : indexOrReadingItem;
        if (!readingItemToFocus)
            return;
        const newActiveReadingItemIndex = orderedReadingItems.indexOf(readingItemToFocus);
        activeReadingItemIndex = newActiveReadingItemIndex;
        Report.log(NAMESPACE, `focus item ${activeReadingItemIndex}`, readingItemToFocus);
        subject.next({ event: 'focus', data: readingItemToFocus });
        const numberOfAdjacentSpineItemToPreLoad = context.getLoadOptions().numberOfAdjacentSpineItemToPreLoad || 0;
        orderedReadingItems.forEach((orderedReadingItem, index) => {
            if (index < (newActiveReadingItemIndex - numberOfAdjacentSpineItemToPreLoad) || index > (newActiveReadingItemIndex + numberOfAdjacentSpineItemToPreLoad)) {
                orderedReadingItem.unloadContent();
            }
            else {
                orderedReadingItem.loadContent();
            }
        });
    };
    const get = (indexOrId) => {
        if (typeof indexOrId === `number`)
            return orderedReadingItems[indexOrId];
        return orderedReadingItems.find(({ item }) => item.id === indexOrId);
    };
    const getPositionOf = (readingItemOrIndex) => {
        var _a;
        const indexOfItem = typeof readingItemOrIndex === 'number' ? readingItemOrIndex : orderedReadingItems.indexOf(readingItemOrIndex);
        const distance = orderedReadingItems.slice(0, indexOfItem + 1).reduce((acc, readingItem) => {
            var _a;
            return {
                start: acc.end,
                end: acc.end + (((_a = readingItem.getBoundingClientRect()) === null || _a === void 0 ? void 0 : _a.width) || 0)
            };
        }, { start: 0, end: 0 });
        if (typeof readingItemOrIndex === 'number') {
            return Object.assign(Object.assign({}, (_a = get(readingItemOrIndex)) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect()), distance);
        }
        return Object.assign(Object.assign({}, readingItemOrIndex.getBoundingClientRect()), distance);
    };
    const getFocusedReadingItem = () => activeReadingItemIndex !== undefined ? orderedReadingItems[activeReadingItemIndex] : undefined;
    const isOffsetOutsideOfFocusedItem = (offset) => {
        const focusedItem = getFocusedReadingItem();
        if (!focusedItem)
            return true;
        const { start, end } = getPositionOf(focusedItem);
        const isOutside = offset < start || offset > end;
        // console.log(`isOffsetOutsideOfFocusedItem`, { start, end, offset, isOutside })
        // @todo rtl
        return isOutside;
    };
    return {
        add: (readingItem) => {
            orderedReadingItems.push(readingItem);
            // @todo unsubscribe on unload
            readingItem.$.subscribe((event) => {
                if (event.event === 'layout') {
                    // @todo at this point the inner item has an upstream layout so we only need to adjust
                    // left/right position of it. We don't need to layout, maybe a `adjustPositionOfItems()` is enough
                    adjustPositionOfItems();
                }
            });
            readingItem.load();
        },
        get,
        set: (readingItems) => {
            orderedReadingItems = readingItems;
        },
        getLength() {
            return orderedReadingItems.length;
        },
        layout,
        focus,
        isAfter: (item1, item2) => {
            return orderedReadingItems.indexOf(item1) > orderedReadingItems.indexOf(item2);
        },
        getPositionOf,
        isOffsetOutsideOfFocusedItem,
        getReadingItemAtOffset: (offset) => {
            const detectedItem = orderedReadingItems.find(item => {
                const { start, end } = getPositionOf(item);
                return offset >= start && offset < end;
            });
            if (!detectedItem) {
                return getFocusedReadingItem();
            }
            return detectedItem || getFocusedReadingItem();
        },
        getFocusedReadingItem,
        getFocusedReadingItemIndex: () => {
            const item = getFocusedReadingItem();
            return item && orderedReadingItems.indexOf(item);
        },
        destroy: () => {
            orderedReadingItems.forEach(item => item.destroy());
        },
        $: subject.asObservable()
    };
};
//# sourceMappingURL=readingItemManager.js.map