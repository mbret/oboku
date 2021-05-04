import { createPrePaginatedReadingItem } from "./prePaginatedReadingItem";
import { createReflowableReadingItem } from "./reflowableReadingItem";
export const createReadingItem = ({ item, context, containerElement }) => {
    let readingItem;
    if (item.renditionLayout === 'pre-paginated') {
        readingItem = createPrePaginatedReadingItem({ item, context, containerElement });
    }
    else {
        readingItem = createReflowableReadingItem({ item, context, containerElement });
    }
    return Object.assign({ item }, readingItem);
};
//# sourceMappingURL=index.js.map