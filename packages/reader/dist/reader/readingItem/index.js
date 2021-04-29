import { createPrePaginatedReadingItem } from "./prePaginatedReadingItem";
import { createReflowableReadingItem } from "./reflowableReadingItem";
export const createReadingItem = ({ item, context, containerElement, fetchResource }) => {
    let readingItem;
    if (item.renditionLayout === 'pre-paginated') {
        readingItem = createPrePaginatedReadingItem({ item, context, containerElement, fetchResource });
    }
    else {
        readingItem = createReflowableReadingItem({ item, context, containerElement, fetchResource });
    }
    return Object.assign({ item }, readingItem);
};
//# sourceMappingURL=index.js.map