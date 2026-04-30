import type { DataSourceDocType } from "../db/docTypes"
import type { GoogleDriveDataSourceDocType } from "../plugins/google"

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
    // TS distributes `Extract<DataSourceDocType, { type: T }>` over the union
    // and intersects the per-member `data_v2` shapes, which collapses to
    // `never` for non-matching providers. The input type already constrains
    // `data_v2` to the matching member, so this is sound at runtime; `any` is
    // the only escape hatch from the distribution.
    return dataSource.data_v2 as any
  } else {
    return undefined
  }
}
