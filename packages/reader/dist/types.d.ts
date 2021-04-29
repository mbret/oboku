declare type TocItem = {
    title: string;
    path: string;
    contents: TocItem[];
};
export declare type Manifest = {
    filename: string;
    nav: {
        toc: TocItem[];
    };
    title: string;
    renditionLayout: `reflowable` | `pre-paginated` | undefined;
    readingDirection: 'ltr' | 'rtl';
    readingOrder: {
        id: string;
        href: string;
        path: string;
        renditionLayout: `reflowable` | `pre-paginated`;
        progressionWeight: number;
    }[];
};
export {};
