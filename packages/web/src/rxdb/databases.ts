import {
  addRxPlugin,
  createRxDatabase,
  RxCollection,
  RxDocument,
  RxJsonSchema,
  RxQuery
} from "rxdb"
import { getReplicationProperties } from "./rxdb-plugins/replication"
import { PromiseReturnType } from "../types"
import {
  CollectionCollection,
  collectionCollectionMethods,
  collectionSchema,
  collectionMigrationStrategies
} from "./schemas/collection"
import { applyHooks } from "./middleware"
import { SafeUpdateMongoUpdateSyntax } from "./types"
import {
  dataSourceSchema,
  dataSourceCollectionMethods,
  DataSourceCollection,
  migrationStrategies as dataSourceMigrationStrategies
} from "./schemas/dataSource"
import { BookDocType, LinkDocType, TagsDocType } from "@oboku/shared"
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder"
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv"
import { RxDBUpdatePlugin } from "rxdb/plugins/update"
import { RxDBReplicationCouchDBPlugin } from "rxdb/plugins/replication-couchdb"
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election"
import { RxDBMigrationPlugin } from "rxdb/plugins/migration"
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode"
import { getRxStoragePouch, addPouchPlugin } from "rxdb/plugins/pouchdb"
import {
  BookCollection,
  bookCollectionMethods,
  bookDocMethods,
  bookSchema,
  bookSchemaMigrationStrategies
} from "./schemas/book"
import { tag, TagCollection } from "./schemas/tags"
import { link, LinkCollection } from "./schemas/link"
import pouchDbAdapterIdb from "pouchdb-adapter-idb"
import pouchDbAdapterHttp from "pouchdb-adapter-http"

// theses plugins does not get automatically added when building for production
addRxPlugin(RxDBLeaderElectionPlugin)
addRxPlugin(RxDBQueryBuilderPlugin)
addRxPlugin(RxDBUpdatePlugin)
addRxPlugin(RxDBReplicationCouchDBPlugin)
addRxPlugin(RxDBMigrationPlugin)

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin)
}

addPouchPlugin(pouchDbAdapterIdb)
addPouchPlugin(pouchDbAdapterHttp)

export enum LibraryViewMode {
  GRID = "grid",
  LIST = "list"
}

export type SettingsDocType = {
  _id: "settings"
  contentPassword: string | null
}

export type DocTypes = TagsDocType | BookDocType | LinkDocType | SettingsDocType

export type SettingsDocument = RxDocument<SettingsDocType>

type SettingsCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<SettingsDocType>,
    cb: (collection: SettingsCollection) => RxQuery
  ) => Promise<SettingsDocument>
}

type SettingsCollection = RxCollection<
  SettingsDocType,
  {},
  SettingsCollectionMethods
>

// export type BookDocumentMutation = RxDocumentMutation<BookDocument | null, Partial<BookDocument> & { tagId?: string, collectionId?: string }>
// export type BookDocumentRemoveMutation = RxDocumentMutation<BookDocument | null, { id: string }>

export type MyDatabaseCollections = {
  tag: TagCollection
  book: BookCollection
  link: LinkCollection
  settings: SettingsCollection
  obokucollection: CollectionCollection
  datasource: DataSourceCollection
}

const settingsSchema: RxJsonSchema<SettingsDocType> = {
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: "string", final: true, maxLength: 50 },
    contentPassword: { type: ["string", "null"] },
    ...getReplicationProperties(`settings`)
  }
}

const settingsCollectionMethods: SettingsCollectionMethods = {
  safeUpdate: async function (this: SettingsCollection, json, cb) {
    return cb(this).update(json)
  }
}

export const settingsMigrationStrategies = {}

export type Database = NonNullable<PromiseReturnType<typeof createDatabase>>

export const createDatabase = async () => {
  const subStorage = getRxStoragePouch("idb", {
    skip_setup: true
  })

  const db = await createRxDatabase<MyDatabaseCollections>({
    name: "oboku-16",
    // NOTICE: Schema validation can be CPU expensive and increases your build size.
    // You should always use a schema validation plugin in development mode.
    // For most use cases, you should not use a validation plugin in production.
    storage: import.meta.env.DEV
      ? wrappedValidateAjvStorage({
          storage: subStorage
        })
      : subStorage,
    multiInstance: false
  })

  await createCollections(db)
  await initializeCollectionsData(db)

  applyHooks(db)

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
    link,
    tag,
    settings: {
      schema: settingsSchema,
      statics: settingsCollectionMethods,
      migrationStrategies: settingsMigrationStrategies
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
        _id: "settings"
      })
    }
  } catch (e) {
    console.warn(e)
  }
}
