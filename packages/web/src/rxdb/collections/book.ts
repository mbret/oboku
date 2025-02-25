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

export const bookSchemaMigrationStrategies: MigrationStrategies = {}

export const bookSchema: RxJsonSchema<
  Omit<BookDocType & DeprecatedBookDocType, `_rev` | `rxdbMeta`>
> = {
  title: "books",
  version: 0,
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
    ...getReplicationProperties(`book`),
  },
  required: [],
}
