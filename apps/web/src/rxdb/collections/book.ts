import type {
  BookDocType,
  DeprecatedBookDocType,
  InsertAbleBookDocType,
} from "@oboku/shared"
import type {
  MigrationStrategies,
  RxCollection,
  RxDocument,
  RxJsonSchema,
} from "rxdb"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId } from "./utils"

// biome-ignore lint/complexity/noBannedTypes: TODO
type BookDocMethods = {}

type BookDocument = RxDocument<BookDocType, BookDocMethods>

type BookCollectionMethods = {
  post: (
    json: Omit<InsertAbleBookDocType, "rx_model" | `rxdbMeta`>,
  ) => Promise<BookDocument>
}

export type BookCollection = RxCollection<
  BookDocType,
  BookDocMethods,
  BookCollectionMethods
>

export const bookDocMethods: BookDocMethods = {}

export const bookCollectionMethods: BookCollectionMethods = {
  post: async function (this: BookCollection, json) {
    return this.insert({ _id: generateId(), ...json } as BookDocType)
  },
}

export const bookSchemaMigrationStrategies: MigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => oldDoc,
  2: (oldDoc: Record<string, unknown>) => oldDoc,
  // v3: added optional `metadataSourcePriority`; nothing to backfill since
  // the field is optional and the merge falls back to the default order.
  3: (oldDoc: Record<string, unknown>) => oldDoc,
  // v4: added optional `bucketCoverKey` marker recording what was last
  // uploaded to the bucket; left undefined for existing docs so the next
  // metadata refresh re-uploads once and populates it.
  4: (oldDoc: Record<string, unknown>) => oldDoc,
}

export const bookSchema: RxJsonSchema<
  Omit<BookDocType & DeprecatedBookDocType, `_rev` | `rxdbMeta`>
> = {
  title: "books",
  version: 4,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    collections: {
      type: "array",
      ref: "obokucollection",
      items: { type: "string" },
    },
    createdAt: { type: ["number"] },
    creator: { type: ["string", "null"] },
    date: { type: ["number", "null"] },
    lang: { type: ["string", "null"] },
    lastMetadataUpdatedAt: { type: ["number", "null"] },
    lastMetadataUpdateError: { type: ["string", "null"] },
    metadataUpdateStatus: { type: ["string", "null"] },
    links: { ref: "link", type: "array", items: { type: "string" } },
    publisher: { type: ["string", "null"] },
    readingStateCurrentBookmarkLocation: { type: ["string", "null"] },
    readingStateCurrentBookmarkProgressPercent: { type: ["number"] },
    readingStateCurrentBookmarkProgressUpdatedAt: {
      type: ["string", "null"],
    },
    readingStateCurrentState: { type: ["string"] },
    rights: { type: ["string", "null"] },
    subject: { type: ["array", "null"], items: { type: "string" } },
    tags: { type: "array", ref: "tag", items: { type: "string" } },
    title: { type: ["string", "null"] },
    modifiedAt: { type: ["string", "null"] },
    isAttachedToDataSource: { type: ["boolean"] },
    isNotInterested: { type: ["boolean"] },
    metadata: { type: ["array"] },
    metadataFetchEnabled: { type: ["boolean", "null"] },
    metadataFileDownloadEnabled: { type: ["boolean", "null"] },
    metadataSourcePriority: { type: ["array"], items: { type: "string" } },
    bucketCoverKey: { type: ["string", "null"] },
    ...getReplicationProperties(`book`),
  },
  required: [],
}
