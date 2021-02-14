import createNano from 'nano';
import { DataSourceDocType, SafeMangoQuery, Errors } from "@oboku/shared";
export declare const createHelpers: (dataSourceId: string, refreshBookMetadata: ({ bookId }: {
    bookId: string;
}) => Promise<any>, db: createNano.DocumentScope<unknown>, getBookCover: ({ coverId }: {
    coverId: string;
}) => Promise<boolean>, userId: string) => {
    refreshBookMetadata: (opts: {
        bookId: string;
    }) => Promise<any>;
    getDataSourceData: <Data>() => Promise<Partial<Data>>;
    isBookCoverExist: (bookId: string) => Promise<boolean>;
    createBook: (data?: Partial<Required<Pick<import("@oboku/shared").BookDocType, "title" | "createdAt" | "creator" | "date" | "lang" | "lastMetadataUpdatedAt" | "metadataUpdateStatus" | "lastMetadataUpdateError" | "publisher" | "readingStateCurrentBookmarkLocation" | "readingStateCurrentBookmarkProgressPercent" | "readingStateCurrentBookmarkProgressUpdatedAt" | "readingStateCurrentState" | "rights" | "subject" | "tags" | "links" | "collections" | "rx_model" | "modifiedAt">>> | undefined) => Promise<createNano.DocumentInsertResponse>;
    findOne: <M extends "link" | "datasource" | "book" | "tag" | "obokucollection", D extends ("link" extends M ? import("@oboku/shared").LinkDocType : never) | ("datasource" extends M ? DataSourceDocType : never) | ("book" extends M ? import("@oboku/shared").BookDocType : never) | ("tag" extends M ? import("@oboku/shared").TagsDocType : never) | ("obokucollection" extends M ? import("@oboku/shared").CollectionDocType : never)>(model: M, query: SafeMangoQuery<D>) => Promise<({
        _id: string;
        _rev: string;
    } & D) | null>;
    find: <M_1 extends "link" | "datasource" | "book" | "tag" | "obokucollection", D_1 extends ("link" extends M_1 ? import("@oboku/shared").LinkDocType : never) | ("datasource" extends M_1 ? DataSourceDocType : never) | ("book" extends M_1 ? import("@oboku/shared").BookDocType : never) | ("tag" extends M_1 ? import("@oboku/shared").TagsDocType : never) | ("obokucollection" extends M_1 ? import("@oboku/shared").CollectionDocType : never)>(model: M_1, query: SafeMangoQuery<D_1>) => Promise<{
        _id: string;
        _rev: string;
    }[]>;
    atomicUpdate: <M_2 extends "link" | "datasource" | "book" | "tag" | "obokucollection", K extends ("link" extends M_2 ? import("@oboku/shared").LinkDocType : never) | ("datasource" extends M_2 ? DataSourceDocType : never) | ("book" extends M_2 ? import("@oboku/shared").BookDocType : never) | ("tag" extends M_2 ? import("@oboku/shared").TagsDocType : never) | ("obokucollection" extends M_2 ? import("@oboku/shared").CollectionDocType : never)>(model: M_2, id: string, cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>) => Promise<createNano.DocumentInsertResponse>;
    create: <M_3 extends "link" | "datasource" | "book" | "tag" | "obokucollection", D_2 extends ("link" extends M_3 ? import("@oboku/shared").LinkDocType : never) | ("datasource" extends M_3 ? DataSourceDocType : never) | ("book" extends M_3 ? import("@oboku/shared").BookDocType : never) | ("tag" extends M_3 ? import("@oboku/shared").TagsDocType : never) | ("obokucollection" extends M_3 ? import("@oboku/shared").CollectionDocType : never)>(model: M_3, data: Pick<D_2, Exclude<keyof D_2, "_id" | "_rev" | "rx_model">>) => Promise<createNano.DocumentInsertResponse>;
    addTagsToBook: (bookId: string, tagIds: string[]) => Promise<createNano.DocumentInsertResponse[] | undefined>;
    addTagsFromNameToBook: (bookId: string, tagNames: string[]) => Promise<createNano.DocumentInsertResponse[] | undefined>;
    getOrcreateTagFromName: (name: string) => Promise<string>;
    addLinkToBook: (bookId: string, linkId: string) => Promise<[createNano.DocumentInsertResponse, createNano.DocumentInsertResponse]>;
    createError: (code?: 'unknown' | 'unauthorized', previousError?: Error | undefined) => Errors.ObokuSharedError;
    extractMetadataFromName: (resourceId: string) => {
        isNotACollection: boolean;
        tags: string[];
        isIgnored: boolean;
        direction: "ltr" | "rtl" | undefined;
    };
};
