import {
  atomicUpdate, createBook, addTagsToBook,
  insert, findOne, DocType, ModelOf, addLinkToBook, find, addTagsFromNameToBook, getOrCreateTagFromName
} from '@oboku/api-shared/src/db/helpers'
import createNano from 'nano'
import { DataSourceDocType, InsertableBookDocType, SafeMangoQuery, Errors, ObokuSharedError } from "@oboku/shared"
import { uniq } from "ramda"

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
    createError: (code: 'unknown' | 'unauthorized' = 'unknown', previousError?: Error) => {
      switch (code) {
        case 'unauthorized':
          return new ObokuSharedError(Errors.ERROR_DATASOURCE_UNAUTHORIZED, previousError)
        default:
          return new ObokuSharedError(Errors.ERROR_DATASOURCE_UNKNOWN, previousError)
      }
    },
    extractMetadataFromName,
  }

  return helpers
}

/**
* Will extract any oboku normalized metadata that exist in the resource id string.
* Use this method to enrich the content that is being synchronized
* @example
* "foo [oboku~no_collection]" -> { isCollection: false }
* "foo [oboku~tags~bar]" -> { tags: ['bar'] }
* "foo [oboku~tags~bar,bar2]" -> { tags: ['bar', 'bar2'] }
*/
export const extractMetadataFromName = (resourceId: string) => {
  let isNotACollection = false
  let tags: string[] = []
  let isIgnored = false
  const directives = resourceId.match(/(\[oboku\~[^\]]*\])+/ig)?.map(str =>
    str.replace(/\[oboku~/, '')
      .replace(/\]/, '')
  )
  directives?.forEach(directive => {
    if (directive === 'no_collection') {
      isNotACollection = true
    }
    if (directive === 'ignore') {
      isIgnored = true
    }
    if (directive.startsWith('tags~')) {
      const newTags: string[] | undefined = directive.replace(/\[tags\~/, '')
        .replace(/\]/, '')
        .split('~')[1]?.split(',')
      tags = [...tags, ...(newTags || [])]
    }
  })

  return {
    isNotACollection,
    tags,
    isIgnored,
  }
}