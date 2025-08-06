import {
  atomicUpdate,
  insert,
  findOne,
  find,
  getOrCreateTagFromName,
} from "src/lib/couch/dbHelpers"
import type createNano from "nano"
import {
  type SafeMangoQuery,
  ObokuErrorCode,
  ObokuSharedError,
  type DocType,
  type ModelOf,
  type DataSourceDocType,
  getDataFromDataSource,
} from "@oboku/shared"

export const createHelpers = (
  refreshBookMetadata: ({ bookId }: { bookId: string }) => Promise<any>,
  db: createNano.DocumentScope<unknown>,
) => {
  const helpers = {
    refreshBookMetadata: (opts: { bookId: string }) =>
      refreshBookMetadata(opts).catch(console.error),
    findOne: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>,
    ) => findOne(model, query, { db }),
    find: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>,
    ) => find(db, model, query),
    atomicUpdate: <M extends DocType["rx_model"], K extends ModelOf<M>>(
      model: M,
      id: string,
      cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>,
    ) => atomicUpdate(db, model, id, cb),
    create: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      data: Omit<D, "rx_model" | "_id" | "_rev">,
    ) => insert(db, model, data),
    // addTagsFromNameToBook: (bookId: string, tagNames: string[]) => addTagsFromNameToBook(db, bookId, tagNames),
    getOrCreateTagFromName: (name: string) => getOrCreateTagFromName(db, name),
  }

  return helpers
}

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

  return data as any
}
