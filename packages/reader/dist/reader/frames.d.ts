import { Context } from "./context";
import { Pagination } from "./pagination";
import { ReadingItem } from "./readingItem";
export declare const normalizeEventPositions: (context: Context, pagination: Pagination, e: PointerEvent | MouseEvent | TouchEvent, readingItem: ReadingItem | undefined) => {
    x: number;
    clientX?: number | undefined;
};
export declare const translateFramePositionIntoPage: (context: Context, pagination: Pagination, position: {
    x: number;
    y: number;
}, readingItem: ReadingItem | undefined) => {
    x: number;
};
