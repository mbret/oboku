import createNano from 'nano';
import { BookDocType, LinkDocType, DataSourceDocType, TagsDocType, CollectionDocType, SafeMangoQuery, InsertableBookDocType } from '@oboku/shared/src';
export declare type DocType = BookDocType | TagsDocType | DataSourceDocType | LinkDocType | CollectionDocType;
export declare type ModelOf<Type extends DocType['rx_model']> = DocType extends (infer DT) ? DT extends DocType ? DT['rx_model'] extends Type ? DT : never : never : never;
export declare const createUser: (db: createNano.ServerScope, username: string, userpass: string) => Promise<void>;
export declare function atomicUpdate<M extends DocType['rx_model'], K extends ModelOf<M>>(db: createNano.DocumentScope<unknown>, rxModel: M, id: string, cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>): Promise<createNano.DocumentInsertResponse>;
export declare const insert: <M extends "link" | "datasource" | "book" | "tag" | "obokucollection", D extends ("link" extends M ? LinkDocType : never) | ("datasource" extends M ? DataSourceDocType : never) | ("book" extends M ? BookDocType : never) | ("tag" extends M ? TagsDocType : never) | ("obokucollection" extends M ? CollectionDocType : never)>(db: createNano.DocumentScope<unknown>, rxModel: M, data: Pick<D, Exclude<keyof D, "_id" | "_rev" | "rx_model">>) => Promise<createNano.DocumentInsertResponse>;
export declare const findOne: <M extends "link" | "datasource" | "book" | "tag" | "obokucollection", D extends ("link" extends M ? LinkDocType : never) | ("datasource" extends M ? DataSourceDocType : never) | ("book" extends M ? BookDocType : never) | ("tag" extends M ? TagsDocType : never) | ("obokucollection" extends M ? CollectionDocType : never)>(db: createNano.DocumentScope<unknown>, rxModel: M, query: SafeMangoQuery<D>) => Promise<({
    _id: string;
    _rev: string;
} & D) | null>;
export declare const find: <M extends "link" | "datasource" | "book" | "tag" | "obokucollection", D extends DocType>(db: createNano.DocumentScope<unknown>, rxModel: M, query: SafeMangoQuery<D>) => Promise<{
    _id: string;
    _rev: string;
}[]>;
export declare const createBook: (db: createNano.DocumentScope<unknown>, data?: Partial<InsertableBookDocType>) => Promise<createNano.DocumentInsertResponse>;
export declare const addTagsToBook: (db: createNano.DocumentScope<unknown>, bookId: string, tagIds: string[]) => Promise<createNano.DocumentInsertResponse[] | undefined>;
export declare const addTagsFromNameToBook: (db: createNano.DocumentScope<unknown>, bookId: string, tagNames: string[]) => Promise<createNano.DocumentInsertResponse[] | undefined>;
export declare const getOrCreateTagFromName: (db: createNano.DocumentScope<unknown>, name: string) => Promise<string>;
export declare const addLinkToBook: (db: createNano.DocumentScope<unknown>, bookId: string, linkId: string) => Promise<[createNano.DocumentInsertResponse, createNano.DocumentInsertResponse]>;
export declare const retryFn: <T>(fn: () => Promise<T>, retry?: number) => Promise<T>;
