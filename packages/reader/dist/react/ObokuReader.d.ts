import { createReader } from "../reader/reader";
import { Manifest } from "../types";
declare type LoadOptions = Parameters<ReturnType<typeof createReader>['load']>[1];
declare type Pagination = ReturnType<ReturnType<typeof createReader>['getPagination']>;
export declare const ObokuReader: ({ manifest, onReady, onReader, loadOptions, onPaginationChange }: {
    manifest?: Manifest | undefined;
    onReady?: (() => void) | undefined;
    onReader?: ((reader: ReturnType<typeof createReader>) => void) | undefined;
    onPaginationChange?: ((pagination: Pagination) => void) | undefined;
    loadOptions?: ({
        fetchResource?: "http" | ((item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        }) => Promise<string>) | undefined;
    } & {
        spineIndexOrIdOrCfi?: string | number | undefined;
    }) | undefined;
}) => JSX.Element;
export {};
