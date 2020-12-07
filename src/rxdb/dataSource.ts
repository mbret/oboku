import { RxDocument, RxJsonSchema, RxQuery, RxDataSource } from "rxdb"
import { withReplicationSchema } from "./rxdb-plugins/replication"
import { SafeUpdateMongoUpdateSyntax } from "./types"

export enum DataSourceType {
  DRIVE = 'DRIVE'
}

export type DataSourceDocType = {
  _id: string,
  type: DataSourceType
  lastSyncedAt: number
  data: String
}

export type DataSourceDocMethods = {}

export type DataSourceDocument = RxDocument<DataSourceDocType, DataSourceDocMethods>

type DataSourceCollectionMethods = {
  post: (json: Omit<DataSourceDocType, '_id'>) => Promise<DataSourceDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<DataSourceDocType>,
    cb: (dataSource: DataSourceCollection) => RxQuery
  ) => Promise<DataSourceDocument>,
}

export type DataSourceCollection = RxDataSource<DataSourceDocType, {}, DataSourceCollectionMethods>

export const dataSourceSchema: RxJsonSchema<Omit<DataSourceDocType, '_id'>> = withReplicationSchema('dataSource', {
  title: 'dataSourceSchema',
  version: 0,
  type: 'object',
  properties: {
    type: { type: 'string', final: true },
    lastSyncedAt: { type: 'number' },
    data: { type: 'string' },
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