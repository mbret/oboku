import { addRxPlugin, createRxDatabase } from "rxdb"
import { PromiseReturnType } from "../types"
import {
  CollectionCollection,
  collectionCollectionMethods,
  collectionSchema,
  collectionMigrationStrategies
} from "./collections/collection"
import { applyHooks } from "./middleware"
import {
  dataSourceSchema,
  dataSourceCollectionMethods,
  DataSourceCollection,
  migrationStrategies as dataSourceMigrationStrategies
} from "./collections/dataSource"
import { BookDocType, LinkDocType, TagsDocType } from "@oboku/shared"
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder"
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv"
import { RxDBUpdatePlugin } from "rxdb/plugins/update"
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema"
import { disableWarnings, RxDBDevModePlugin } from "rxdb/plugins/dev-mode"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import {
  BookCollection,
  bookCollectionMethods,
  bookDocMethods,
  bookSchema,
  bookSchemaMigrationStrategies
} from "./collections/book"
import { tag, TagCollection } from "./collections/tags"
import { link, LinkCollection } from "./collections/link"
import {
  initializeSettings,
  SettingsCollection,
  SettingsDocType,
  settingsSchema
} from "./collections/settings"
import { conflictHandler } from "./replication/conflictHandler"
import { RxDBCleanupPlugin } from "rxdb/plugins/cleanup"
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election"

// theses plugins does not get automatically added when building for production
addRxPlugin(RxDBQueryBuilderPlugin)
addRxPlugin(RxDBUpdatePlugin)
addRxPlugin(RxDBMigrationPlugin)
addRxPlugin(RxDBCleanupPlugin)
// used by RxDBCleanupPlugin
addRxPlugin(RxDBLeaderElectionPlugin)

if (import.meta.env.DEV) {
  disableWarnings()
  addRxPlugin(RxDBDevModePlugin)
}

export type DocTypes = TagsDocType | BookDocType | LinkDocType | SettingsDocType

export type MyDatabaseCollections = {
  tag: TagCollection
  book: BookCollection
  link: LinkCollection
  settings: SettingsCollection
  obokucollection: CollectionCollection
  datasource: DataSourceCollection
}

export const settingsMigrationStrategies = {}

export type Database = NonNullable<PromiseReturnType<typeof createDatabase>>

export const createDatabase = async (
  params: Partial<Parameters<typeof createRxDatabase>[0]> = {}
) => {
  const storage = getRxStorageDexie()

  const db = await createRxDatabase<MyDatabaseCollections>({
    ...params,
    name: "oboku-35",
    // NOTICE: Schema validation can be CPU expensive and increases your build size.
    // You should always use a schema validation plugin in development mode.
    // For most use cases, you should not use a validation plugin in production.
    storage: import.meta.env.DEV
      ? wrappedValidateAjvStorage({
          storage
        })
      : storage,
    multiInstance: false,
    cleanupPolicy: {
      /**
       * The minimum time in milliseconds for how long
       * a document has to be deleted before it is
       * purged by the cleanup.
       * [default=one month]
       */
      minimumDeletedTime: 1000 * 60 * 60 * 24 * 31, // one month,
      /**
       * The minimum amount of that that the RxCollection must have existed.
       * This ensures that at the initial page load, more important
       * tasks are not slowed down because a cleanup process is running.
       * [default=60 seconds]
       */
      minimumCollectionAge: 1000 * 60, // 60 seconds
      /**
       * After the initial cleanup is done,
       * a new cleanup is started after [runEach] milliseconds
       * [default=5 minutes]
       */
      runEach: 1000 * 60 * 5, // 5 minutes
      /**
       * If set to true,
       * RxDB will await all running replications
       * to not have a replication cycle running.
       * This ensures we do not remove deleted documents
       * when they might not have already been replicated.
       * [default=true]
       */
      awaitReplicationsInSync: true,
      /**
       * If true, it will only start the cleanup
       * when the current instance is also the leader.
       * This ensures that when RxDB is used in multiInstance mode,
       * only one instance will start the cleanup.
       * [default=true]
       */
      waitForLeadership: true
    }
  })

  await db.addCollections({
    book: {
      schema: bookSchema,
      methods: bookDocMethods,
      statics: bookCollectionMethods,
      migrationStrategies: bookSchemaMigrationStrategies,
      conflictHandler
    },
    link,
    tag,
    settings: {
      schema: settingsSchema,
      conflictHandler
    },
    obokucollection: {
      schema: collectionSchema,
      statics: collectionCollectionMethods,
      migrationStrategies: collectionMigrationStrategies,
      conflictHandler
    },
    datasource: {
      schema: dataSourceSchema,
      statics: dataSourceCollectionMethods,
      migrationStrategies: dataSourceMigrationStrategies,
      conflictHandler
    }
  })

  await initializeSettings(db)

  applyHooks(db)

  return db
}
