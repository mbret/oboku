import { Context } from "./context";
import { Pagination } from "./pagination";
import { ReadingItem } from "./readingItem";
import { ReadingOrderView } from "./readingOrderView";
import { Manifest } from "./types";
export declare type ChapterInfo = {
    title: string;
    subChapter?: ChapterInfo;
    path: string;
};
export declare const buildChapterInfoFromReadingItem: (manifest: Manifest, readingItem: ReadingItem) => ChapterInfo | undefined;
export declare const getPercentageEstimate: (context: Context, readingOrderView: ReadingOrderView, pagination: Pagination) => number;
