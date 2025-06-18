import type {
  DataSourceDocType,
  GoogleDriveDataSourceDocType,
} from "../db/docTypes"

export type GoogleDriveDataSourceData = NonNullable<
  GoogleDriveDataSourceDocType["data_v2"]
>

export const generateResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string,
) => `${uniqueResourceIdentifier}-${resourceId}`

export const extractIdFromResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string,
) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)

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
    return dataSource.data_v2 as any
  } else {
    return undefined
  }
}

export const dataSourceHelpers = {
  generateResourceId,
  extractIdFromResourceId,
  getDataFromDataSource,
}
