import { atom, selector } from "recoil";
import { DataSourceDocType } from '../rxdb/dataSource'

export const normalizedDataSourcesState = atom<Record<string, DataSourceDocType | undefined>>({
  key: 'dataSourcesState',
  default: {}
})

export const dataSourcesAsArrayState = selector<DataSourceDocType[]>({
  key: 'dataSourcesAsArrayState',
  get: ({ get }) => {
    const dataSources = get(normalizedDataSourcesState)
    
    return Object.values(dataSources) as NonNullable<typeof dataSources[number]>[]
  }
})