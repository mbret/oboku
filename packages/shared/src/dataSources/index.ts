import type {
  DataSourceDocType,
  GoogleDriveDataSourceDocType,
} from "../db/docTypes"

export type GoogleDriveDataSourceData = NonNullable<
  GoogleDriveDataSourceDocType["data_v2"]
>

export const getDataFromDataSource = <T extends DataSourceDocType["type"]>(
  dataSource: Pick<Extract<DataSourceDocType, { type: T }>, "data_v2">,
): Extract<DataSourceDocType, { type: T }>["data_v2"] | undefined => {
  // compat with old datasources
  if (
    dataSource &&
    "data" in dataSource &&
    dataSource.data &&
    typeof dataSource.data === "string"
  ) {
    try {
      return JSON.parse(dataSource.data)
    } catch (_e) {
      return undefined
    }
  } else if (dataSource.data_v2) {
    // required because TS cannot narrow the union to the exact member from the generic
    return dataSource.data_v2 as any
  } else {
    return undefined
  }
}
