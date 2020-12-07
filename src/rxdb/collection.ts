import { RxCollection, RxDocument, RxJsonSchema, RxQuery } from "rxdb"
import { withReplicationSchema } from "./rxdb-plugins/replication"
import { SafeUpdateMongoUpdateSyntax } from "./types"

export type CollectionDocType = {
  _id: string,
  name: string,
  books: string[]
}

export type CollectionDocMethods = {}

export type CollectionDocument = RxDocument<CollectionDocType, CollectionDocMethods>

type CollectionCollectionMethods = {
  post: (json: Omit<CollectionDocType, '_id'>) => Promise<CollectionDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<CollectionDocType>,
    cb: (collection: CollectionCollection) => RxQuery
  ) => Promise<CollectionDocument>,
}

export type CollectionCollection = RxCollection<CollectionDocType, {}, CollectionCollectionMethods>

export const collectionSchema: RxJsonSchema<Omit<CollectionDocType, '_id'>> = withReplicationSchema('collection', {
  title: 'books',
  version: 0,
  type: 'object',
  properties: {
    name: { type: 'string' },
    books: { type: 'array', ref: 'book', items: { type: 'string' } },
  },
  required: []
})

export const collectionCollectionMethods: CollectionCollectionMethods = {
  post: async function (this: CollectionCollection, json) {
    return this.insert(json as CollectionDocType)
  },
  safeUpdate: async function (this: CollectionCollection, json, cb) {
    return cb(this).update(json)
  }
};