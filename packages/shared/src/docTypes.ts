export type LinkDocType = {
  _id: string;
  _rev: string;
  type: DataSourceType;
  resourceId: string;
  data: string | null;
  book: string | null;
  rx_model: 'link';
  contentLength?: number | null;
  modifiedAt: string | null
  createdAt: string
};

export enum DataSourceType {
  URI = "URI",
  DRIVE = "DRIVE",
  DROPBOX = "DROPBOX",
  FILE = 'FILE'
}

export type GoogleDriveDataSourceData = {
  applyTags: string[]
  folderId: string
  folderName?: string
};

export type DropboxDataSourceData = {
  folderId: string
  folderName: string
  applyTags: string[]
}

export type DataSourceDocType = {
  _id: string;
  _rev: string;
  type: DataSourceType;
  lastSyncedAt: number | null;
  lastSyncErrorCode?: string | null,
  credentials?: any
  data: string;
  rx_model: 'datasource';
  modifiedAt: string | null
  createdAt: string
};

export enum ReadingStateState {
  Finished = "FINISHED",
  NotStarted = "NOT_STARTED",
  Reading = "READING"
}

export type InsertableBookDocType = Required<Omit<BookDocType, '_id' | '_rev'>>;

export type BookDocType = {
  _id: string;
  _rev: string;
  createdAt: number;
  creator: string | null;
  date: number | null;
  lang: string | null;
  lastMetadataUpdatedAt: number | null;
  publisher: string | null;
  readingStateCurrentBookmarkLocation: string | null;
  readingStateCurrentBookmarkProgressPercent: number;
  readingStateCurrentBookmarkProgressUpdatedAt: string | null;
  readingStateCurrentState: ReadingStateState;
  rights: string | null;
  subject: string[] | null;
  tags: string[];
  links: string[];
  collections: string[];
  title: string | null;
  rx_model: 'book';
  modifiedAt: string | null
};

export type TagsDocType = {
  _id: string;
  _rev: string;
  name: null | string;
  isProtected: boolean;
  isBlurEnabled?: boolean;
  books: string[];
  rx_model: 'tag';
  modifiedAt: string | null
  createdAt: string
};

export type CollectionDocType = {
  _id: string;
  _rev: string;
  name: string;
  books: string[];
  /**
   * Can be used as extra id for datasources in order to have
   * better accuracy when syncing. For example every drive collection
   * created will have `resourceId: drive-564asdQWjasd54` so that even
   * if user rename the folder a little bit we will not create a new collection
   */
  resourceId?: string | null;
  rx_model: 'obokucollection';
  modifiedAt: string | null
  createdAt: string
};

export function isTag(document: TagsDocType | unknown): document is TagsDocType {
  return (document as TagsDocType).rx_model === 'tag'
}

export function isBook(document: BookDocType | unknown): document is BookDocType {
  return (document as BookDocType).rx_model === 'book'
}

export function isLink(document: LinkDocType | unknown): document is LinkDocType {
  return (document as LinkDocType).rx_model === 'link'
}

export function isDataSource(document: DataSourceDocType | unknown): document is DataSourceDocType {
  return (document as DataSourceDocType).rx_model === 'datasource'
}

export function isCollection(document: CollectionDocType | unknown): document is CollectionDocType {
  return (document as CollectionDocType).rx_model === 'obokucollection'
}

type DataOf<D extends DataSourceDocType> =
  D['type'] extends (DataSourceType.DRIVE)
  ? GoogleDriveDataSourceData
  : D['type'] extends (DataSourceType.DROPBOX)
  ? DropboxDataSourceData
  : GoogleDriveDataSourceData | DropboxDataSourceData

export const extractDataSourceData = <D extends DataSourceDocType, Data extends DataOf<D>>({ data }: D): Data | undefined => {
  try {
    return JSON.parse(data)
  } catch (e) { }
  return undefined
}

type MangoOperator = '$lt' | '$lte' | '$eq' | '$ne' | '$gte' | '$gt' |
  '$exists' | '$type' |
  '$in' | '$nin' | '$size' | '$mod' | '$regex' |
  '$or' | '$and' | '$nor' | '$not' | '$all' | '$allMatch' | '$elemMatch';

type ConditionOperator<T> = {
  $nin?: any[]
  $in?: any[]
}

interface MangoQuery<RxDocType> {
  // JSON object describing criteria used to select documents.
  // selector?: MangoSelector;
  selector?: {
    [key in (keyof RxDocType)]?: RxDocType[key] | ConditionOperator<RxDocType[key]>
  } | {
    $or: {
      [key in (keyof RxDocType)]?: RxDocType[key] | MangoQuerySelector<RxDocType[key]>
    }[]
  }

  // Maximum number of results returned. Default is 25.
  // limit?: number;

  // Skip the first 'n' results, where 'n' is the value specified.
  // skip?: number;

  // JSON array following sort syntax.
  // sort?: SortOrder[];

  // JSON array specifying which fields of each object should be returned. If it is omitted,
  // the entire object is returned.
  // http://docs.couchdb.org/en/latest/api/database/find.html#filtering-fields
  // fields?: string[];

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

type OneValue<T> = T extends Array<any> ? T[number] : T;

export type MangoQuerySelector<T> = T;

export type SafeMangoQuery<RxDocType = any> = MangoQuery<RxDocType>

export { };
