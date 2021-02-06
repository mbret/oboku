import { addRxPlugin, createRxDatabase, RxCollection, RxDocument, RxJsonSchema, RxQuery } from 'rxdb'
import { RxdbReplicationPlugin, withReplicationSchema } from './rxdb-plugins/replication';
import { MongoUpdateSyntax, PromiseReturnType } from '../types';
import { CollectionCollection, collectionCollectionMethods, collectionSchema, collectionMigrationStrategies } from './collection';
import { applyHooks } from './middleware';
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from './types';
import { dataSourceSchema, dataSourceCollectionMethods, DataSourceCollection, migrationStrategies as dataSourceMigrationStrategies } from './dataSource';
import { BookDocType, LinkDocType, TagsDocType } from 'oboku-shared';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
import { RxDBValidatePlugin } from 'rxdb/plugins/validate'
import { RxDBUpdatePlugin } from 'rxdb/plugins/update'
import { RxDBReplicationPlugin } from 'rxdb/plugins/replication'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration'
import { BookCollection, bookCollectionMethods, bookDocMethods, bookSchema, bookSchemaMigrationStrategies } from './schemas/book';

// theses plugins does not get automatically added when building for production
addRxPlugin(RxDBLeaderElectionPlugin)
addRxPlugin(RxDBQueryBuilderPlugin)
addRxPlugin(RxDBValidatePlugin)
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBReplicationPlugin)
addRxPlugin(RxdbReplicationPlugin)
addRxPlugin(RxDBMigrationPlugin)

addRxPlugin(require('pouchdb-adapter-idb'));
addRxPlugin(require('pouchdb-adapter-http'))

export enum LibraryViewMode {
  GRID = 'grid',
  LIST = 'list'
}

export type AuthDocType = {
  id: 'auth',
  token: null | string,
  email: null | string,
  userId: string | null,
}

export type SettingsDocType = {
  id: 'settings',
  contentPassword: string | null,
}

export type DocTypes = AuthDocType | TagsDocType | BookDocType | LinkDocType | SettingsDocType

type TagsDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<TagsDocType>) => Promise<any>
};

type LinkDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<LinkDocType>) => Promise<any>
}
type AuthDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<AuthDocType>) => Promise<any>
}

type TagsDocument = RxDocument<TagsDocType, TagsDocMethods>
export type AuthDocument = RxDocument<AuthDocType, AuthDocMethods>
export type SettingsDocument = RxDocument<SettingsDocType>
type LinkDocument = RxDocument<LinkDocType, LinkDocMethods>

type AuthCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<AuthDocType>,
    cb: (collection: AuthCollection) => RxQuery<AuthDocType, AuthDocument | null>
  ) => Promise<AuthDocument>,
}
type SettingsCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<SettingsDocType>,
    cb: (collection: SettingsCollection) => RxQuery
  ) => Promise<SettingsDocument>
}
type TagsCollectionMethods = {
  post: (json: Omit<TagsDocType, '_id' | 'rx_model' | '_rev'>) => Promise<TagsDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<TagsDocType>,
    cb: (collection: TagsCollection) => RxQuery
  ) => Promise<AuthDocument>
}

type LinkCollectionMethods = {
  post: (json: Omit<LinkDocType, '_id' | 'rx_model' | '_rev'>) => Promise<LinkDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<LinkDocType>,
    cb: (collection: LinkCollection) => RxQuery
  ) => Promise<AuthDocument>,
  safeFind: (updateObj: SafeMangoQuery<LinkDocType>) => RxQuery<LinkDocType, RxDocument<LinkDocType, LinkDocMethods>[]>
}

type SettingsCollection = RxCollection<SettingsDocType, any, SettingsCollectionMethods>
type AuthCollection = RxCollection<AuthDocType, AuthDocMethods, AuthCollectionMethods>
type TagsCollection = RxCollection<TagsDocType, TagsDocMethods, TagsCollectionMethods>
type LinkCollection = RxCollection<LinkDocType, LinkDocMethods, LinkCollectionMethods>

// export type BookDocumentMutation = RxDocumentMutation<BookDocument | null, Partial<BookDocument> & { tagId?: string, collectionId?: string }>
// export type BookDocumentRemoveMutation = RxDocumentMutation<BookDocument | null, { id: string }>

export type MyDatabaseCollections = {
  auth: AuthCollection,
  tag: TagsCollection,
  book: BookCollection,
  link: LinkCollection,
  settings: SettingsCollection,
  obokucollection: CollectionCollection,
  datasource: DataSourceCollection,
}

const authSchema: RxJsonSchema<AuthDocType> = {
  title: 'auth',
  version: 0,
  type: 'object',
  properties: {
    id: { type: 'string', primary: true, final: true },
    token: { type: ['string', 'null'], final: false, },
    email: { type: ['string', 'null'], final: false, },
    userId: { type: ['string', 'null'], },
  }
}

const settingsSchema: RxJsonSchema<SettingsDocType> = withReplicationSchema('settings', {
  version: 0,
  type: 'object',
  properties: {
    id: { type: 'string', primary: true, final: true },
    contentPassword: { type: ['string', 'null'] },
  }
})

const tagsSchema: RxJsonSchema<Omit<TagsDocType, '_id' | 'rx_model' | '_rev'>> = withReplicationSchema('tag', {
  title: 'tag',
  version: 1,
  type: 'object',
  properties: {
    name: { type: ['string'], final: false },
    isProtected: { type: ['boolean'], final: false },
    books: { type: ['array'], items: { type: 'string' } },
    createdAt: { type: 'string' },
    modifiedAt: { type: ['string', 'null'] },
  },
  required: ['isProtected', 'name', 'books']
})

const tagsSchemaMigrationStrategies = {
  1: (oldDoc: TagsDocType): TagsDocType | null => {

    return {
      ...oldDoc,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    }
  }
}

const linkSchema: RxJsonSchema<Omit<Required<LinkDocType>, '_id' | 'rx_model' | '_rev'>> = withReplicationSchema('link', {
  title: 'link',
  version: 1,
  type: 'object',
  properties: {
    data: { type: ['string', 'null'] },
    resourceId: { type: 'string' },
    type: { type: 'string' },
    book: { type: ['string', 'null'] },
    contentLength: { type: ['number', 'null'] },
    createdAt: { type: 'string' },
    modifiedAt: { type: ['string', 'null'] },
  },
  required: ['data', 'resourceId', 'type']
})

const linkSchemaMigrationStrategies = {
  1: (oldDoc: TagsDocType): TagsDocType | null => {

    return {
      ...oldDoc,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    }
  }
}

const tagsDocMethods: TagsDocMethods = {
  safeUpdate: function (this: TagsDocument, updateObj) {
    return this.update(updateObj)
  }
};

const linkDocMethods: LinkDocMethods = {
  safeUpdate: async function (this: LinkDocument, updateObj) {
    return this.update(updateObj)
  },
}

const authCollectionMethods: AuthCollectionMethods = {
  safeUpdate: async function (this: AuthCollection, json, cb) {
    const doc = await cb(this).exec()
    return doc?.update(json)
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
};

const linkCollectionMethods: LinkCollectionMethods = {
  post: async function (this: LinkCollection, json) {
    return this.insert(json as LinkDocType)
  },
  safeUpdate: async function (this: LinkCollection, json, cb) {
    return cb(this).update(json)
  },
  safeFind: function (this: LinkCollection, json) {
    return this.find(json)
  }
}

type Database = NonNullable<PromiseReturnType<typeof createDatabase>>

export const createDatabase = async () => {
  const db = await createRxDatabase<MyDatabaseCollections>({
    name: 'oboku', 
    adapter: 'idb',
    multiInstance: false,
    pouchSettings: {
      skip_setup: true,
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
    auth: {
      schema: authSchema,
      statics: authCollectionMethods,
    },
    book: {
      schema: bookSchema,
      methods: bookDocMethods,
      statics: bookCollectionMethods,
      migrationStrategies: bookSchemaMigrationStrategies,
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
      migrationStrategies: tagsSchemaMigrationStrategies,
    },
    settings: {
      schema: settingsSchema,
      statics: settingsCollectionMethods
    },
    obokucollection: {
      schema: collectionSchema,
      statics: collectionCollectionMethods,
      migrationStrategies: collectionMigrationStrategies,
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
    const authDoc = await db.auth.findOne().exec()
    if (!authDoc) {
      await db.auth.insert({
        id: 'auth',
        token: null,
        email: null,
        userId: null,
      })
    }

    const settings = await db.settings.findOne().exec()
    if (!settings) {
      await db.settings.insert({
        contentPassword: null,
        id: 'settings'
      })
    }
  } catch (e) {
    console.warn(e)
  }
}