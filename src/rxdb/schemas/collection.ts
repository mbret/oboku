import { RxCollection, RxDocument, RxJsonSchema, RxQuery } from "rxdb"
import { withReplicationSchema } from "../rxdb-plugins/replication"
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from "../types"
import { CollectionDocType } from 'oboku-shared'

type CollectionDocSchema = Required<Omit<CollectionDocType, '_id' | 'rx_model' | '_rev'>>

export type CollectionDocMethods = {}

export type CollectionDocument = RxDocument<CollectionDocType, CollectionDocMethods>

type CollectionCollectionMethods = {
  post: (json: Omit<CollectionDocType, '_id' | 'rx_model' | '_rev'>) => Promise<CollectionDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<CollectionDocType>,
    cb: (collection: CollectionCollection) => RxQuery
  ) => Promise<CollectionDocument>,
  safeFind: (updateObj: SafeMangoQuery<CollectionDocType>) => RxQuery<CollectionDocType, RxDocument<CollectionDocType, CollectionDocMethods>[]>
}

export type CollectionCollection = RxCollection<CollectionDocType, {}, CollectionCollectionMethods>

export const collectionSchema: RxJsonSchema<CollectionDocSchema> = withReplicationSchema('obokucollection', {
  title: 'obokucollection',
  version: 1,
  type: 'object',
  properties: {
    name: { type: 'string' },
    books: { type: 'array', ref: 'book', items: { type: 'string' } },
    resourceId: { type: ['string', 'null'], },
    createdAt: { type: 'string' },
    modifiedAt: { type: ['string', 'null'] },
  },
  required: ['name']
})

export const collectionMigrationStrategies = {
  1: (oldDoc: CollectionDocType): CollectionDocType | null => {

    return {
      ...oldDoc,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    }
  }
}

export const collectionCollectionMethods: CollectionCollectionMethods = {
  post: async function (this: CollectionCollection, json) {
    return this.insert(json as CollectionDocType)
  },
  safeUpdate: async function (this: CollectionCollection, json, cb) {
    return cb(this).update(json)
  },
  safeFind: function (this: CollectionCollection, json) {
    return this.find(json)
  }
};