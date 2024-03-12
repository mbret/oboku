import {
  atomicUpdate,
  createBook,
  addTagsToBook,
  insert,
  findOne,
  addLinkToBook,
  find,
  getOrCreateTagFromName
} from "@libs/couch/dbHelpers"
import createNano from "nano"
import {
  InsertAbleBookDocType,
  SafeMangoQuery,
  ObokuErrorCode,
  ObokuSharedError,
  DocType,
  ModelOf
} from "@oboku/shared"

export const createHelpers = (
  dataSourceId: string,
  refreshBookMetadata: ({ bookId }: { bookId: string }) => Promise<any>,
  db: createNano.DocumentScope<unknown>,
  getBookCover: ({ coverId }: { coverId: string }) => Promise<boolean>,
  nameHex: string
) => {
  const helpers = {
    refreshBookMetadata: (opts: { bookId: string }) =>
      refreshBookMetadata(opts).catch(console.error),
    getDataSourceData: async <Data>(): Promise<Partial<Data>> => {
      const dataSource = await findOne(db, "datasource", {
        selector: { _id: dataSourceId }
      })
      let data = {}
      try {
        if (dataSource?.data) {
          data = JSON.parse(dataSource?.data)
        }
      } catch (e) {
        console.error(e)
      }

      return data
    },
    isBookCoverExist: async (bookId: string) =>
      getBookCover({ coverId: `${nameHex}-${bookId}` }),
    createBook: (data?: Partial<InsertAbleBookDocType>) => createBook(db, data),
    findOne: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>
    ) => findOne(db, model, query),
    find: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>
    ) => find(db, model, query),
    atomicUpdate: <M extends DocType["rx_model"], K extends ModelOf<M>>(
      model: M,
      id: string,
      cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>
    ) => atomicUpdate(db, model, id, cb),
    create: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      data: Omit<D, "rx_model" | "_id" | "_rev">
    ) => insert(db, model, data),
    addTagsToBook: (bookId: string, tagIds: string[]) =>
      addTagsToBook(db, bookId, tagIds),
    // addTagsFromNameToBook: (bookId: string, tagNames: string[]) => addTagsFromNameToBook(db, bookId, tagNames),
    getOrCreateTagFromName: (name: string) => getOrCreateTagFromName(db, name),
    addLinkToBook: (bookId: string, linkId: string) =>
      addLinkToBook(db, bookId, linkId),
  }

  return helpers
}

export const createError = (
  code: "unknown" | "unauthorized" | "rateLimitExceeded" = "unknown",
  previousError?: Error
) => {
  switch (code) {
    case "unauthorized":
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
        previousError
      )
    case "rateLimitExceeded":
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED,
        previousError
      )
    default:
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN,
        previousError
      )
  }
}
