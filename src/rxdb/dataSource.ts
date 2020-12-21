import { RxDocument, RxJsonSchema, RxQuery, RxCollection } from "rxdb"
import { DataSourceDocType } from 'oboku-shared'
import { withReplicationSchema } from "./rxdb-plugins/replication"
import { SafeUpdateMongoUpdateSyntax } from "./types"

export type DataSourceDocMethods = {}

export type DataSourceDocument = RxDocument<DataSourceDocType, DataSourceDocMethods>

type DataSourceCollectionMethods = {
  post: (json: Omit<DataSourceDocType, '_id' | 'rx_model' | '_rev'>) => Promise<DataSourceDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<DataSourceDocType>,
    cb: (dataSource: DataSourceCollection) => RxQuery
  ) => Promise<DataSourceDocument>,
}

export type DataSourceCollection = RxCollection<DataSourceDocType, {}, DataSourceCollectionMethods>

// export type DataSourceMutation = RxDocumentMutation<DataSourceDocument, Omit<DataSourceDocType, '_id'>>

export const dataSourceSchema: RxJsonSchema<Omit<DataSourceDocType, '_id' | 'rx_model' | '_rev'>> = withReplicationSchema('datasource', {
  title: 'dataSourceSchema',
  version: 0,
  type: 'object',
  properties: {
    type: { type: 'string', final: true },
    lastSyncedAt: { type: ['number', 'null'] },
    lastSyncErrorCode: { type: ['string', 'null'] },
    data: { type: 'string' },
    credentials: { type: ['object', 'null'] },
  },
  required: []
})

export const dataSourceCollectionMethods: DataSourceCollectionMethods = {
  post: async function (this: DataSourceCollection, json) {
    return this.insert(json as DataSourceDocType)
  },
  safeUpdate: async function (this: DataSourceCollection, json, cb) {
    return cb(this).update(json)
  }
};