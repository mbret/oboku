import {
  addRxPlugin,
  createRxDatabase,
  RxCollection,
  RxDocument,
  RxJsonSchema,
  RxQuery
} from "rxdb"
import {
  RxdbReplicationPlugin,
  withReplicationSchema
} from "./rxdb-plugins/replication"
import { MongoUpdateSyntax, PromiseReturnType } from "../types"
import {
  CollectionCollection,
  collectionCollectionMethods,
  collectionSchema,
  collectionMigrationStrategies
} from "./schemas/collection"
import { applyHooks } from "./middleware"
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from "./types"
import {
  dataSourceSchema,
  dataSourceCollectionMethods,
  DataSourceCollection,
  migrationStrategies as dataSourceMigrationStrategies
} from "./dataSource"
import { BookDocType, LinkDocType, TagsDocType } from "@oboku/shared"
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder"
import { RxDBValidatePlugin } from "rxdb/plugins/validate"
import { RxDBUpdatePlugin } from "rxdb/plugins/update"
import { RxDBReplicationPlugin } from "rxdb/plugins/replication"
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election"
import { RxDBMigrationPlugin } from "rxdb/plugins/migration"
import {
  BookCollection,
  bookCollectionMethods,
  bookDocMethods,
  bookSchema,
  bookSchemaMigrationStrategies
} from "./schemas/book"

// theses plugins does not get automatically added when building for production
addRxPlugin(RxDBLeaderElectionPlugin)
addRxPlugin(RxDBQueryBuilderPlugin)
addRxPlugin(RxDBValidatePlugin)
addRxPlugin(RxDBUpdatePlugin)
addRxPlugin(RxDBReplicationPlugin)
addRxPlugin(RxdbReplicationPlugin)
addRxPlugin(RxDBMigrationPlugin)

addRxPlugin(require("pouchdb-adapter-idb"))
addRxPlugin(require("pouchdb-adapter-http"))

export enum LibraryViewMode {
  GRID = "grid",
  LIST = "list"
}

export type SettingsDocType = {
  id: "settings"
  contentPassword: string | null
}

export type DocTypes = TagsDocType | BookDocType | LinkDocType | SettingsDocType

type TagsDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<TagsDocType>) => Promise<any>
}

type LinkDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<LinkDocType>) => Promise<any>
}

type TagsDocument = RxDocument<TagsDocType, TagsDocMethods>
export type SettingsDocument = RxDocument<SettingsDocType>
type LinkDocument = RxDocument<LinkDocType, LinkDocMethods>

type SettingsCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<SettingsDocType>,
    cb: (collection: SettingsCollection) => RxQuery
  ) => Promise<SettingsDocument>
}

type TagsCollectionMethods = {
  post: (
    json: Omit<TagsDocType, "_id" | "rx_model" | "_rev">
  ) => Promise<TagsDocument>
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<TagsDocType>,
    cb: (collection: TagsCollection) => RxQuery
  ) => Promise<TagsDocument>
}

type LinkCollectionMethods = {
  safeInsert: (
    json: Omit<LinkDocType, "_id" | "rx_model" | "_rev">
  ) => Promise<LinkDocument>
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<LinkDocType>,
    cb: (collection: LinkCollection) => RxQuery
  ) => Promise<TagsDocument>
  safeFind: (
    updateObj: SafeMangoQuery<LinkDocType>
  ) => RxQuery<LinkDocType, RxDocument<LinkDocType, LinkDocMethods>[]>
  safeFindOne: (
    updateObj: SafeMangoQuery<LinkDocType>
  ) => RxQuery<LinkDocType, RxDocument<LinkDocType, LinkDocMethods> | null>
}

type SettingsCollection = RxCollection<
  SettingsDocType,
  any,
  SettingsCollectionMethods
>
type TagsCollection = RxCollection<
  TagsDocType,
  TagsDocMethods,
  TagsCollectionMethods
>
type LinkCollection = RxCollection<
  LinkDocType,
  LinkDocMethods,
  LinkCollectionMethods
>

// export type BookDocumentMutation = RxDocumentMutation<BookDocument | null, Partial<BookDocument> & { tagId?: string, collectionId?: string }>
// export type BookDocumentRemoveMutation = RxDocumentMutation<BookDocument | null, { id: string }>

export type MyDatabaseCollections = {
  tag: TagsCollection
  book: BookCollection
  link: LinkCollection
  settings: SettingsCollection
  obokucollection: CollectionCollection
  datasource: DataSourceCollection
}

const settingsSchema: RxJsonSchema<SettingsDocType> = withReplicationSchema(
  "settings",
  {
    version: 0,
    type: "object",
    properties: {
      id: { type: "string", primary: true, final: true },
      contentPassword: { type: ["string", "null"] }
    }
  }
)

const tagsSchema: RxJsonSchema<
  Required<Omit<TagsDocType, "_id" | "rx_model" | "_rev">>
> = withReplicationSchema("tag", {
  title: "tag",
  version: 2,
  type: "object",
  properties: {
    name: { type: ["string"], final: false },
    isProtected: { type: ["boolean"], final: false },
    isBlurEnabled: { type: ["boolean"] },
    books: { type: ["array"], items: { type: "string" } },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] }
  },
  required: ["isProtected", "name", "books"]
})

const tagsSchemaMigrationStrategies = {
  1: (
    oldDoc: Omit<TagsDocType, `createdAt` | `modifiedAt`>
  ): TagsDocType | null => ({
    createdAt: new Date().toISOString(),
    modifiedAt: null,
    ...oldDoc
  }),
  2: (oldDoc: TagsDocType): TagsDocType | null => oldDoc
}

const linkSchema: RxJsonSchema<
  Omit<Required<LinkDocType>, "_id" | "rx_model" | "_rev">
> = withReplicationSchema("link", {
  title: "link",
  version: 1,
  type: "object",
  properties: {
    data: { type: ["string", "null"] },
    resourceId: { type: "string" },
    type: { type: "string" },
    book: { type: ["string", "null"] },
    contentLength: { type: ["number", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] }
  },
  required: ["data", "resourceId", "type"]
})

const linkSchemaMigrationStrategies = {
  1: (
    oldDoc: Omit<TagsDocType, `createdAt` | `modifiedAt`>
  ): TagsDocType | null => {
    return {
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      ...oldDoc
    }
  }
}

const tagsDocMethods: TagsDocMethods = {
  safeUpdate: function (this: TagsDocument, updateObj) {
    return this.update(updateObj)
  }
}

const linkDocMethods: LinkDocMethods = {
  safeUpdate: async function (this: LinkDocument, updateObj) {
    return this.update(updateObj)
  }
}

const settingsCollectionMethods: SettingsCollectionMethods = {
  safeUpdate: async function (this: SettingsCollection, json, cb) {
    return cb(this).update(json)
  }
}
const tagsCollectionMethods: TagsCollectionMethods = {
  post: async function (this: TagsCollection, json) {
    return this.insert(json as TagsDocType)
  },
  safeUpdate: async function (this: TagsCollection, json, cb) {
    return cb(this).update(json)
  }
}

const linkCollectionMethods: LinkCollectionMethods = {
  safeInsert: async function (this: LinkCollection, json) {
    return this.insert(json as LinkDocType)
  },
  safeUpdate: async function (this: LinkCollection, json, cb) {
    return cb(this).update(json)
  },
  safeFind: function (this: LinkCollection, json) {
    return this.find(json)
  },
  safeFindOne: function (this: LinkCollection, json) {
    return this.findOne(json)
  }
}

type Database = NonNullable<PromiseReturnType<typeof createDatabase>>

export const createDatabase = async () => {
  const db = await createRxDatabase<MyDatabaseCollections>({
    name: "oboku",
    adapter: "idb",
    multiInstance: false,
    pouchSettings: {
      skip_setup: true
    }
  })

  await createCollections(db)
  await initializeCollectionsData(db)

  applyHooks(db)

  // @ts-ignore
  window.db = db

  return db
}

const createCollections = async (db: Database) => {
  await db.addCollections({
    book: {
      schema: bookSchema,
      methods: bookDocMethods,
      statics: bookCollectionMethods,
      migrationStrategies: bookSchemaMigrationStrategies
    },
    link: {
      schema: linkSchema,
      statics: linkCollectionMethods,
      methods: linkDocMethods,
      migrationStrategies: linkSchemaMigrationStrategies
    },
    tag: {
      schema: tagsSchema,
      methods: tagsDocMethods,
      statics: tagsCollectionMethods,
      migrationStrategies: tagsSchemaMigrationStrategies
    },
    settings: {
      schema: settingsSchema,
      statics: settingsCollectionMethods
    },
    obokucollection: {
      schema: collectionSchema,
      statics: collectionCollectionMethods,
      migrationStrategies: collectionMigrationStrategies
    },
    datasource: {
      schema: dataSourceSchema,
      statics: dataSourceCollectionMethods,
      migrationStrategies: dataSourceMigrationStrategies
    }
  })
}

const initializeCollectionsData = async (db: Database) => {
  try {
    const settings = await db.settings.findOne().exec()
    if (!settings) {
      await db.settings.insert({
        contentPassword: null,
        id: "settings"
      })
    }
  } catch (e) {
    console.warn(e)
  }
}
