import {
  atomicUpdate, createBook, addTagsToBook,
  insert, findOne, DocType, ModelOf, addLinkToBook, find, addTagsFromNameToBook, getOrCreateTagFromName
} from '@oboku/api-shared/src/db/helpers'
import createNano from 'nano'
import { InsertableBookDocType, SafeMangoQuery, Errors, ObokuSharedError } from "@oboku/shared/src"
import { extractMetadataFromName } from '@oboku/shared/src/directives'

export const createHelpers = (
  dataSourceId: string,
  refreshBookMetadata: ({ bookId }: { bookId: string }) => Promise<any>,
  db: createNano.DocumentScope<unknown>,
  getBookCover: ({ coverId }: { coverId: string }) => Promise<boolean>,
  userId: string
) => {
  const helpers = {
    refreshBookMetadata: (opts: { bookId: string }) => refreshBookMetadata(opts).catch(console.error),
    getDataSourceData: async <Data>(): Promise<Partial<Data>> => {
      const dataSource = await findOne(db, 'datasource', { selector: { _id: dataSourceId } })
      let data = {}
      try {
        if (dataSource?.data) {
          data = JSON.parse(dataSource?.data)
        }
      } catch (e) { }

      return data
    },
    isBookCoverExist: async (bookId: string) => getBookCover({ coverId: `${userId}-${bookId}` }),
    createBook: (data?: Partial<InsertableBookDocType>) => createBook(db, data),
    findOne: <M extends DocType['rx_model'], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>
    ) => findOne(db, model, query),
    find: <M extends DocType['rx_model'], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>
    ) => find(db, model, query),
    atomicUpdate: <M extends DocType['rx_model'], K extends ModelOf<M>>(
      model: M,
      id: string,
      cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>
    ) => atomicUpdate(db, model, id, cb),
    create: <M extends DocType['rx_model'], D extends ModelOf<M>>(
      model: M,
      data: Omit<D, 'rx_model' | '_id' | '_rev'>
    ) => insert(db, model, data),
    addTagsToBook: (bookId: string, tagIds: string[]) => addTagsToBook(db, bookId, tagIds),
    addTagsFromNameToBook: (bookId: string, tagNames: string[]) => addTagsFromNameToBook(db, bookId, tagNames),
    getOrcreateTagFromName: (name: string) => getOrCreateTagFromName(db, name),
    addLinkToBook: (bookId: string, linkId: string) => addLinkToBook(db, bookId, linkId),
    createError: (code: 'unknown' | 'unauthorized' | 'rateLimitExceeded' = 'unknown', previousError?: Error) => {
      switch (code) {
        case 'unauthorized':
          return new ObokuSharedError(Errors.ERROR_DATASOURCE_UNAUTHORIZED, previousError)
        case 'rateLimitExceeded':
          return new ObokuSharedError(Errors.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED, previousError)
        default:
          return new ObokuSharedError(Errors.ERROR_DATASOURCE_UNKNOWN, previousError)
      }
    },
    extractMetadataFromName,
  }

  return helpers
}