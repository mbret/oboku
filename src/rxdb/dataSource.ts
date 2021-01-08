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

export const dataSourceSchema: RxJsonSchema<Omit<DataSourceDocType, '_id' | 'rx_model' | '_rev'>> = withReplicationSchema('datasource', {
  title: 'dataSourceSchema',
  version: 1,
  type: 'object',
  properties: {
    type: { type: 'string', final: true },
    lastSyncedAt: { type: ['number', 'null'] },
    lastSyncErrorCode: { type: ['string', 'null'] },
    data: { type: 'string' },
    credentials: { type: ['object', 'null'] },
    createdAt: { type: 'string' },
    modifiedAt: { type: ['string', 'null'] },
  },
  required: [],
})

export const migrationStrategies = {
  1: (oldDoc: DataSourceDocType): DataSourceDocType | null => {

    return {
      ...oldDoc,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    }
  }
}

export const dataSourceCollectionMethods: DataSourceCollectionMethods = {
  post: async function (this: DataSourceCollection, json) {
    return this.insert(json as DataSourceDocType)
  },
  safeUpdate: async function (this: DataSourceCollection, json, cb) {
    return cb(this).update(json)
  }
};