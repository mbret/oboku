import createNano from 'nano'
import {
  BookDocType, LinkDocType, isBook, isLink, DataSourceDocType, isDataSource, isTag,
  TagsDocType, isCollection, CollectionDocType, SafeMangoQuery, InsertableBookDocType, ReadingStateState
} from "@oboku/shared"
import { waitForRandomTime } from "../utils"
import { User } from './couchDbEntities'

export type DocType = BookDocType | TagsDocType | DataSourceDocType | LinkDocType | CollectionDocType

export type ModelOf<Type extends DocType['rx_model']> = DocType extends (infer DT) ? DT extends DocType ? DT['rx_model'] extends Type ? DT : never : never : never

export const createUser = async (db: createNano.ServerScope, username: string, userpass: string) => {
  const obokuDb = db.use('_users')
  const newUser = new User(`org.couchdb.user:${username}`, username, userpass, '')

  await obokuDb.insert(newUser, newUser._id)
}

export async function atomicUpdate<M extends DocType['rx_model'], K extends ModelOf<M>>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  id: string,
  cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>
) {
  return retryFn(async () => {
    const doc = (await db.get(id)) as createNano.DocumentGetResponse & K
    const { rx_model, ...rest } = cb(doc)
    if (rxModel !== doc.rx_model) throw new Error('Invalid document type')

    return await db.insert({ ...rest, rx_model, _rev: doc._rev, _id: doc._id })
  })
}

export const insert = async <M extends DocType['rx_model'], D extends ModelOf<M>>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  data: Omit<D, 'rx_model' | '_id' | '_rev'>
) => {
  const dinalData = { ...data, rx_model: rxModel }

  const doc = await db.insert(dinalData as any)

  if (!doc.ok) throw new Error('Unable to create docuemnt')

  return doc
}

export const findOne = async <M extends DocType['rx_model'], D extends ModelOf<M>>(db: createNano.DocumentScope<unknown>, rxModel: M, query: SafeMangoQuery<D>) => {
  const response = await retryFn(() => db.find({ ...query, selector: { rx_model: rxModel, ...query?.selector as any }, limit: 1 }))

  if (response.docs.length === 0) return null

  const doc = response.docs[0] as createNano.MangoResponse<unknown>['docs'][number] & D

  if (rxModel !== doc.rx_model) throw new Error(`Invalid document type`)

  return doc
}

export const find = async <M extends DocType['rx_model'], D extends DocType>(db: createNano.DocumentScope<unknown>, rxModel: M, query: SafeMangoQuery<D>) => {
  const response = await retryFn(() => db.find({ ...query, selector: { rx_model: rxModel, ...query?.selector as any }, limit: 1 }))

  return response.docs
}

export const createBook = async (db: createNano.DocumentScope<unknown>, data: Partial<InsertableBookDocType> = {}) => {
  const insertData: InsertableBookDocType = {
    collections: [],
    createdAt: new Date().getTime(),
    creator: null,
    date: null,
    lang: null,
    lastMetadataUpdatedAt: null,
    lastMetadataUpdateError: null,
    metadataUpdateStatus: null,
    links: [],
    publisher: null,
    readingStateCurrentBookmarkLocation: null,
    readingStateCurrentBookmarkProgressPercent: 0,
    readingStateCurrentBookmarkProgressUpdatedAt: null,
    readingStateCurrentState: ReadingStateState.NotStarted,
    rights: null,
    rx_model: 'book',
    subject: null,
    tags: [],
    title: null,
    modifiedAt: null,
  }

  return insert(db, 'book', { ...insertData, ...data })
}

export const addTagsToBook = async (db: createNano.DocumentScope<unknown>, bookId: string, tagIds: string[]) => {
  if (tagIds.length === 0) return
  return Promise.all([
    atomicUpdate(db, 'book', bookId, old => ({
      ...old,
      tags: [...old.tags.filter(tag => !tagIds.includes(tag)), ...tagIds]
    })),
    ...tagIds.map(tagId => atomicUpdate(db, 'tag', tagId, old => ({
      ...old,
      books: [...old.books.filter(id => id !== bookId), bookId],
    })))
  ])
}

export const addTagsFromNameToBook = async (db: createNano.DocumentScope<unknown>, bookId: string, tagNames: string[]) => {
  if (tagNames.length === 0) return
  // Get all tag ids and create one if it does not exist
  const tagIds = await Promise.all(tagNames.map(async (name) => getOrCreateTagFromName(db, name)))

  return await addTagsToBook(db, bookId, tagIds)
}

export const getOrCreateTagFromName = (db: createNano.DocumentScope<unknown>, name: string) => {
  return retryFn(async () => {
    // Get all tag ids and create one if it does not exist
    const existingTag = await findOne(db, 'tag', { selector: { name } })
    if (existingTag) {
      return existingTag._id
    }
    const insertedTag = await insert(db, 'tag', {
      isProtected: false,
      books: [],
      name,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })

    return insertedTag.id
  })
}

export const addLinkToBook = async (db: createNano.DocumentScope<unknown>, bookId: string, linkId: string) => {
  return Promise.all([
    atomicUpdate(db, 'book', bookId, old => ({
      ...old,
      links: [...old.links.filter(id => id !== linkId), linkId]
    })),
    atomicUpdate(db, 'link', linkId, old => ({
      ...old,
      book: bookId
    }))
  ])
}

export const retryFn = async <T>(fn: () => Promise<T>, retry = 100) => {
  let currentRetry = retry

  const retryable = async (): Promise<T> => {
    try {
      return await fn()
    } catch (e) {
      if ((e.statusCode >= 500 || e.statusCode === 409) && currentRetry > 0) {
        await waitForRandomTime(1, 200)
        currentRetry--
        return await retryable()
      }
      throw e
    }
  }

  return await retryable()
}