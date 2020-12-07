import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { addRxPlugin, createRxDatabase, removeRxDatabase, RxCollection, RxDatabase, RxDocument, RxJsonSchema, RxQuery, RxQueryOptions } from 'rxdb'
import { Subscription } from 'rxjs';
import { RxdbReplicationPlugin, withReplicationSchema } from './rxdb-plugins/replication';
import { MongoUpdateSyntax, PromiseReturnType } from '../types';
import { CollectionCollection, collectionCollectionMethods, collectionSchema } from './collection';
import { applyHooks } from './middleware';
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from './types';
import { dataSourceSchema, dataSourceCollectionMethods, DataSourceCollection } from './dataSource';

addRxPlugin(require('pouchdb-adapter-idb'));
addRxPlugin(require('pouchdb-adapter-http'))
addRxPlugin(RxdbReplicationPlugin)

export enum ReadingStateState {
  Finished = 'FINISHED',
  NotStarted = 'NOT_STARTED',
  Reading = 'READING'
}

export enum DownloadState {
  None = 'none',
  Downloaded = 'downloaded',
  Downloading = 'downloading'
}

export enum LinkType {
  Uri = 'URI',
  Drive = 'DRIVE'
}

export enum LibraryViewMode {
  GRID = 'grid',
  LIST = 'list'
}

export type AuthDocType = {
  id: 'auth',
  token: null | string,
  email: null | string,
  hasDoneWelcomeTour: boolean,
  hasDoneReaderTour: boolean,
}

export type LibraryDocType = {
  viewMode: LibraryViewMode
  isLibraryUnlocked: boolean,
}

export type SettingsDocType = {
  id: 'settings',
  contentPassword: string | null,
}

export type TagsDocType = {
  _id: string,
  name: null | string,
  isProtected: boolean,
  books: string[],
}

export type LinkDocType = {
  _id: string,
  type: LinkType
  resourceId: string
  data: string | null,
  books: string[]
}

export type BookDocType = {
  _id: string,
  createdAt: number,
  creator: string | null,
  date: number,
  lang: string | null,
  lastMetadataUpdatedAt: number | null,
  publisher: string | null,
  readingStateCurrentBookmarkLocation: string | null,
  readingStateCurrentBookmarkProgressPercent: number,
  readingStateCurrentBookmarkProgressUpdatedAt: number | null,
  readingStateCurrentState: ReadingStateState,
  rights: string | null,
  subject: string | null,
  tags: string[],
  links: string[],
  collections: string[],
  title: string | null,
}

export type DocTypes = AuthDocType | TagsDocType | BookDocType | LinkDocType | LibraryDocType | SettingsDocType

type TagsDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<TagsDocType>) => Promise<any>
};
type BookDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<BookDocType>) => Promise<any>
}
type LinkDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<LinkDocType>) => Promise<any>
}
type AuthDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<AuthDocType>) => Promise<any>
}

type TagsDocument = RxDocument<TagsDocType, TagsDocMethods>
export type AuthDocument = RxDocument<AuthDocType, AuthDocMethods>
export type SettingsDocument = RxDocument<SettingsDocType>
type BookDocument = RxDocument<BookDocType, BookDocMethods>
type LinkDocument = RxDocument<LinkDocType, LinkDocMethods>
export type LibraryDocument = RxDocument<LibraryDocType>


type AuthCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<AuthDocType>,
    cb: (collection: AuthCollection) => RxQuery
  ) => Promise<AuthDocument>
}
type SettingsCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<SettingsDocType>,
    cb: (collection: SettingsCollection) => RxQuery
  ) => Promise<SettingsDocument>
}
type LibraryCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<LibraryDocType>,
    cb: (collection: LibraryCollection) => RxQuery
  ) => Promise<LibraryDocument>
}
type TagsCollectionMethods = {
  post: (json: Omit<TagsDocType, '_id'>) => Promise<TagsDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<TagsDocType>,
    cb: (collection: TagsCollection) => RxQuery
  ) => Promise<AuthDocument>
}
type BookCollectionMethods = {
  post: (json: Omit<BookDocType, '_id'>) => Promise<BookDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<BookDocType>,
    cb: (collection: BookCollection) => RxQuery
  ) => Promise<BookDocument>
}
type LinkCollectionMethods = {
  post: (json: Omit<LinkDocType, '_id'>) => Promise<LinkDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<LinkDocType>,
    cb: (collection: LinkCollection) => RxQuery
  ) => Promise<AuthDocument>,
  safeFind: (updateObj: SafeMangoQuery<LinkDocType>) => RxQuery<LinkDocType, RxDocument<LinkDocType, LinkDocMethods>[]>
}

type SettingsCollection = RxCollection<SettingsDocType, any, SettingsCollectionMethods>
type AuthCollection = RxCollection<AuthDocType, AuthDocMethods, AuthCollectionMethods>
type TagsCollection = RxCollection<TagsDocType, TagsDocMethods, TagsCollectionMethods>
type BookCollection = RxCollection<BookDocType, BookDocMethods, BookCollectionMethods>
type LinkCollection = RxCollection<LinkDocType, LinkDocMethods, LinkCollectionMethods>
type LibraryCollection = RxCollection<LibraryDocType, any, LibraryCollectionMethods>

export type MyDatabaseCollections = {
  auth: AuthCollection,
  tag: TagsCollection,
  book: BookCollection,
  link: LinkCollection,
  library: LibraryCollection,
  settings: SettingsCollection,
  collection: CollectionCollection,
  dataSource: DataSourceCollection,
}

const authSchema: RxJsonSchema<AuthDocType> = {
  title: 'auth',
  version: 0,
  type: 'object',
  properties: {
    id: { type: 'string', primary: true, final: true },
    token: { type: ['string', 'null'], final: false, },
    email: { type: ['string', 'null'], final: false, },
    hasDoneReaderTour: { type: 'boolean' },
    hasDoneWelcomeTour: { type: 'boolean' },
  }
}

const librarySchema: RxJsonSchema<LibraryDocType> = {
  version: 0,
  type: 'object',
  properties: {
    isLibraryUnlocked: { type: 'boolean' },
    viewMode: { type: 'string' },
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

const tagsSchema: RxJsonSchema<Omit<TagsDocType, '_id'>> = withReplicationSchema('tag', {
  title: 'tag',
  version: 0,
  type: 'object',
  properties: {
    name: { type: ['string'], final: false },
    isProtected: { type: ['boolean'], final: false },
    books: { type: ['array'], items: { type: 'string' } },
  },
  required: ['isProtected', 'name', 'books']
})

const linkSchema: RxJsonSchema<Omit<LinkDocType, '_id'>> = withReplicationSchema('link', {
  title: 'link',
  version: 0,
  type: 'object',
  properties: {
    data: { type: ['string', 'null'] },
    resourceId: { type: 'string' },
    type: { type: 'string' },
    books: { ref: 'book', type: 'array', items: { type: 'string' } }
  },
  required: ['data', 'resourceId', 'type', 'books']
})

const bookSchema: RxJsonSchema<Omit<BookDocType, '_id'>> = withReplicationSchema('book', {
  title: 'books',
  version: 0,
  type: 'object',
  properties: {
    collections: { type: ['array'], items: { type: 'string' } },
    createdAt: { type: ['number'] },
    creator: { type: ['string', 'null'] },
    date: { type: ['number'] },
    lang: { type: ['string', 'null'] },
    lastMetadataUpdatedAt: { type: ['number', 'null'] },
    links: { ref: 'link', type: 'array', items: { type: 'string' } },
    publisher: { type: ['string', 'null'] },
    readingStateCurrentBookmarkLocation: { type: ['string', 'null'] },
    readingStateCurrentBookmarkProgressPercent: { type: ['number'] },
    readingStateCurrentBookmarkProgressUpdatedAt: { type: ['number', 'null'] },
    readingStateCurrentState: { type: ['string'] },
    rights: { type: ['string', 'null'] },
    subject: { type: ['string', 'null'] },
    tags: { type: 'array', ref: 'tag', items: { type: 'string' } },
    title: { type: ['string', 'null'] },
  },
  required: []
})

const tagsDocMethods: TagsDocMethods = {
  safeUpdate: function (this: TagsDocument, updateObj) {
    return this.update(updateObj)
  }
};
const bookDocMethods: BookDocMethods = {
  safeUpdate: function (this: BookDocument, updateObj) {
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
    return cb(this).update(json)
  }
}
const settingsCollectionMethods: SettingsCollectionMethods = {
  safeUpdate: async function (this: SettingsCollection, json, cb) {
    return cb(this).update(json)
  }
}
const libraryCollectionMethods: LibraryCollectionMethods = {
  safeUpdate: async function (this: LibraryCollection, json, cb) {
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
const bookCollectionMethods: BookCollectionMethods = {
  post: async function (this: BookCollection, json) {
    return this.insert(json as BookDocType)
  },
  safeUpdate: async function (this: BookCollection, json, cb) {
    return cb(this).update(json)
  },
}
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

const databaseState = atom<{ valid }>({ key: 'database', default: { valid: false } })

const createDatabase = async () => {
  // await removeRxDatabase('oboku', 'idb')
  const db = await createRxDatabase<MyDatabaseCollections>({
    name: 'oboku',
    adapter: 'idb',
    multiInstance: true,
    ignoreDuplicate: false
  })

  await createCollections(db)
  await initializeCollectionsData(db)

  applyHooks(db)

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
    },
    link: {
      schema: linkSchema,
      statics: linkCollectionMethods,
      methods: linkDocMethods,
    },
    tag: {
      schema: tagsSchema,
      methods: tagsDocMethods,
      statics: tagsCollectionMethods
    },
    library: {
      schema: librarySchema,
      statics: libraryCollectionMethods
    },
    settings: {
      schema: settingsSchema,
      statics: settingsCollectionMethods
    },
    collection: {
      schema: collectionSchema,
      statics: collectionCollectionMethods,
    },
    dataSource: {
      schema: dataSourceSchema,
      statics: dataSourceCollectionMethods,
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
        hasDoneReaderTour: false,
        hasDoneWelcomeTour: false,
      })
    }

    const settings = await db.settings.findOne().exec()
    if (!settings) {
      await db.settings.insert({
        contentPassword: null,
        id: 'settings'
      })
    }

    const libraryDoc = await db.library.findOne().exec()
    if (!libraryDoc) {
      await db.library.insert({
        viewMode: LibraryViewMode.GRID,
        isLibraryUnlocked: false,
      })
    }
  } catch (e) {
    console.warn(e)
  }
}

export const useReCreateDb = () => {
  const [, setDb] = useRecoilState(databaseState)
  const currentDb = useDatabase()

  return async () => {
    _db = undefined
    dbIsLoading = true
    setDb({ valid: false })

    // at this point we expect useDatabase to be rendered
    // again with undefined database. So that nothing should interact with
    // the db while it's being recreated
    await currentDb?.remove()
    _db = await createDatabase()

    // We force a new render of useDatabase to notify everyone
    dbIsLoading = false
    setDb({ valid: true })

    return _db
  }
}

let dbIsLoading = false
let _db: Database | undefined = undefined

export const useDatabase = () => {
  const [{ valid }, setDbState] = useRecoilState(databaseState)
  const [db, setDb] = useState(_db)

  useEffect(() => {
    if (!valid && !db && !dbIsLoading) {
      console.warn(valid, db, dbIsLoading)
      dbIsLoading = true;
      (async () => {
        _db = await createDatabase()
        dbIsLoading = false
        setDbState({ valid: true })
        setDb(_db)
      })()
    }
  }, [valid, setDbState, db])

  return _db
}
