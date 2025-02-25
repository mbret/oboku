import { CollectionMetadata } from "../metadata"
import { BookDocType } from "./books"
import { CouchDBMeta } from "./couchdb"
import { RxDbMeta } from "./rxdb"

type CommonBase = CouchDBMeta & RxDbMeta

export type LinkDocType = CommonBase & {
  /**
   * unique type.
   * This is used to lookup plugin configurations
   */
  type: string
  /**
   * Is used as unique identifier for the datasource specifically.
   * This can be used to detect if an item already exist for a datasource
   * during synchronization for example.
   * A good example is for example to use the google file/folder id as resource id.
   * This way a quick lookup is possible to detect if the file/folder already exist.
   * Datasources can use this field the way they want as long as they use the unique identifier helper
   * function to generate/extract it.
   */
  resourceId: string
  /**
   * Direct match to datasource id from database. This is to
   * retrieve which link is linked to datasource
   */
  dataSourceId?: string
  /**
   * Extra data field that can be used by any datasource to store
   * any form of data. Needs to be serialized as a string
   */
  data: string | null | Record<string, unknown>
  book: string | null
  rx_model: "link"
  contentLength?: number | null
  modifiedAt: string | null
  createdAt: string
}

export type DataSourceDocType = CommonBase & {
  type: string
  lastSyncedAt: number | null
  syncStatus: null | "fetching"
  lastSyncErrorCode?: string | null
  credentials?: any
  data: string
  rx_model: "datasource"
  modifiedAt: string | null
  createdAt: string
  isProtected?: boolean
}

export type InsertAbleBookDocType = Omit<BookDocType, "_id" | "_rev">

/**
 * @deprecated
 */
export type DeprecatedBookDocType = {
  creator: string | null
  date: number | null
  lang: string | null
  publisher: string | null
  rights: string | null
  subject: string[] | null
  title: string | null
}

export type TagsDocType = CommonBase & {
  name: null | string
  isProtected: boolean
  isBlurEnabled?: boolean
  books: string[]
  rx_model: "tag"
  modifiedAt: string | null
  createdAt: string
}

export type CollectionDocType = CommonBase & {
  books: string[]
  linkType?: string
  linkResourceId?: string
  rx_model: "obokucollection"
  modifiedAt: string | null
  /**
   * Is used to avoid updating an item if the sync item
   * is not changed
   */
  syncAt?: string | null
  createdAt: string
  lastMetadataUpdatedAt?: string
  lastMetadataStartedAt?: string
  metadataUpdateStatus?: "fetching" | "idle"
  lastMetadataUpdateError?: null | string
  type?: "series" | "shelve"
  metadata?: CollectionMetadata[]
}

export function isTag(
  document: TagsDocType | unknown,
): document is TagsDocType {
  return (document as TagsDocType).rx_model === "tag"
}

export function isBook(
  document: BookDocType | unknown,
): document is BookDocType {
  return (document as BookDocType).rx_model === "book"
}

export function isLink(
  document: LinkDocType | unknown,
): document is LinkDocType {
  return (document as LinkDocType).rx_model === "link"
}

export function isDataSource(
  document: DataSourceDocType | unknown,
): document is DataSourceDocType {
  return (document as DataSourceDocType).rx_model === "datasource"
}

export function isCollection(
  document: CollectionDocType | unknown,
): document is CollectionDocType {
  return (document as CollectionDocType).rx_model === "obokucollection"
}

type MangoSelectorOperator<T> = {
  $nin?: any[]
  $in?: any[]
  $ne?: T
  $elemMatch?: {
    $eq: T extends Array<any> ? T[number] : T
  }
}

interface MangoQuery<RxDocType> {
  // JSON object describing criteria used to select documents.
  // selector?: MangoSelector;
  selector?:
    | {
        [key in keyof RxDocType]?:
          | RxDocType[key]
          | MangoSelectorOperator<RxDocType[key]>
      }
    | {
        $or: {
          [key in keyof RxDocType]?:
            | RxDocType[key]
            | MangoQuerySelector<RxDocType[key]>
        }[]
      }

  // Maximum number of results returned. Default is 25.
  limit?: number

  // Skip the first 'n' results, where 'n' is the value specified.
  // skip?: number;

  // JSON array following sort syntax.
  // sort?: SortOrder[];

  // JSON array specifying which fields of each object should be returned. If it is omitted,
  // the entire object is returned.
  // http://docs.couchdb.org/en/latest/api/database/find.html#filtering-fields
  fields?: (keyof RxDocType)[]

  // Instruct a query to use a specific index.
  // Specified either as "<design_document>" or ["<design_document>", "<index_name>"].
  // use_index?: string | [string, string];

  // Read quorum needed for the result. This defaults to 1.
  // r?: number;

  // A string that enables you to specify which page of results you require. Used for paging through result sets.
  // bookmark?: string;

  // Whether to update the index prior to returning the result. Default is true.
  // update?: boolean;

  // Whether or not the view results should be returned from a “stable” set of shards.
  // stable?: boolean;

  // Combination of update = false and stable = true options.Possible options: "ok", false (default).
  // stale?: 'ok' | false;

  // Include execution statistics in the query response. Optional, default: false.
  // execution_stats?: boolean;
}

export type MangoQuerySelector<T> = T

export type SafeMangoQuery<RxDocType = any> = MangoQuery<RxDocType>

export type DocType =
  | BookDocType
  | TagsDocType
  | DataSourceDocType
  | LinkDocType
  | CollectionDocType

export type ModelOf<Type extends DocType["rx_model"]> = DocType extends infer DT
  ? DT extends DocType
    ? DT["rx_model"] extends Type
      ? DT
      : never
    : never
  : never

export {}
