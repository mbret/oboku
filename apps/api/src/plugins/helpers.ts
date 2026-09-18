import { findOne } from "src/couch/dbHelpers"
import type createNano from "nano"
import {
  ObokuErrorCode,
  ObokuSharedError,
  type DataSourceDocType,
  getDataFromDataSource,
} from "@oboku/shared"

export const createError = (
  code: "unknown" | "unauthorized" | "rateLimitExceeded" = "unknown",
  previousError?: Error,
) => {
  switch (code) {
    case "unauthorized":
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
        previousError,
      )
    case "rateLimitExceeded":
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED,
        previousError,
      )
    default:
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN,
        previousError,
      )
  }
}

export const getDataSourceData = async <T extends DataSourceDocType["type"]>({
  db,
  dataSourceId,
}: {
  db: createNano.DocumentScope<unknown>
  dataSourceId: string
}): Promise<Extract<DataSourceDocType, { type: T }>["data_v2"]> => {
  const dataSource = await findOne(
    "datasource",
    {
      selector: { _id: dataSourceId },
    },
    { db },
  )

  if (!dataSource) {
    throw new Error("DataSource not found")
  }

  const data = getDataFromDataSource(dataSource as DataSourceDocType)

  // Same Extract-distribution limitation as `getDataFromDataSource`: the
  // generic `T` prevents TS from collapsing the per-provider union members.
  return data as any
}
