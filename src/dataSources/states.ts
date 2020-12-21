import { atom, selector } from "recoil";
import { DataSourceDocType, DataSourceType } from 'oboku-shared'

export type DataSource = DataSourceDocType

export const normalizedDataSourcesState = atom<Record<string, DataSource | undefined>>({
  key: 'dataSourcesState',
  default: {}
})

export const dataSourcesAsArrayState = selector<DataSource[]>({
  key: 'dataSourcesAsArrayState',
  get: ({ get }) => {
    const dataSources = get(normalizedDataSourcesState)

    return Object.values(dataSources) as NonNullable<typeof dataSources[number]>[]
  }
})

// export const credentialsState = atom<Record<string, any | undefined>>({
//   key: 'credentialsState',
//   default: {}
// })