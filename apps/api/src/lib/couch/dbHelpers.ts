import createNano from "nano"
import { type MangoResponse } from "nano"
import {
  type SafeMangoQuery,
  type InsertAbleBookDocType,
  ReadingStateState,
  type DocType,
  type ModelOf,
  type DataSourceDocType,
  isShallowEqual,
} from "@oboku/shared"
import { User } from "../couchDbEntities"
import { waitForRandomTime } from "../utils"
import { generatePassword } from "../authentication/generatePassword"
import { findOne } from "./findOne"

export { findOne }

export const createUser = async (
  db: createNano.ServerScope,
  username: string,
  password: string,
) => {
  const obokuDb = db.use("_users")
  const newUser = new User(`org.couchdb.user:${username}`, username, password)

  return await obokuDb.insert(newUser, newUser._id)
}

export const getOrCreateUserFromEmail = async (
  db: createNano.ServerScope,
  email: string,
) => {
  const usersDb = db.use<User>("_users")

  const {
    docs: [user],
  } = await usersDb.find({
    selector: {
      email,
    },
  })

  if (user) return user

  const generatedPassword = generatePassword()

  const { ok } = await createUser(db, email, generatedPassword)

  if (!ok) throw new Error("Error when creating user")

  const {
    docs: [createdUser],
  } = await usersDb.find({
    selector: {
      email,
    },
  })

  return createdUser
}

export async function atomicUpdate<
  M extends DocType["rx_model"],
  K extends ModelOf<M>,
>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  id: string,
  cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>,
) {
  return retryFn(async () => {
    const doc = (await db.get(id)) as createNano.DocumentGetResponse & K
    const newDoc = cb(doc)
    const { rx_model, ...rest } = newDoc

    if (rxModel !== doc.rx_model) throw new Error("Invalid document type")

    if (isShallowEqual(doc, newDoc)) return null

    const response = await db.insert({
      ...rest,
      rx_model,
      _rev: doc._rev,
      _id: doc._id,
    })

    return response
  })
}

export const insert = async <
  M extends DocType["rx_model"],
  D extends ModelOf<M>,
>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  data: Omit<D, "rx_model" | "_id" | "_rev">,
) => {
  const finalData = { ...data, rx_model: rxModel }

  const doc = await db.insert(finalData as any)

  if (!doc.ok) throw new Error("Unable to create document")

  return doc
}

export const findAllDataSources = async (
  db: createNano.DocumentScope<unknown>,
) => {
  return db.find({
    selector: {
      rx_model: "datasource",
    },
  }) as Promise<MangoResponse<DataSourceDocType>>
}

export const find = async <M extends DocType["rx_model"], D extends ModelOf<M>>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  query: SafeMangoQuery<D>,
) => {
  const { fields, ...restQuery } = query
  const response = await retryFn(() =>
    db.find({
      ...restQuery,
      fields: fields as string[],
      selector: { rx_model: rxModel, ...(query?.selector as any) },
    }),
  )

  return response.docs as (createNano.MangoResponse<unknown>["docs"][number] &
    D)[]
}

export const createBook = async (
  db: createNano.DocumentScope<unknown>,
  data: Partial<InsertAbleBookDocType> = {},
) => {
  const insertData: InsertAbleBookDocType = {
    collections: [],
    createdAt: Date.now(),
    lastMetadataUpdatedAt: null,
    lastMetadataUpdateError: null,
    metadataUpdateStatus: null,
    links: [],
    readingStateCurrentBookmarkLocation: null,
    readingStateCurrentBookmarkProgressPercent: 0,
    readingStateCurrentBookmarkProgressUpdatedAt: null,
    readingStateCurrentState: ReadingStateState.NotStarted,
    rx_model: "book",
    tags: [],
    modifiedAt: null,
    isAttachedToDataSource: false,
    rxdbMeta: { lwt: Date.now() },
    ...data,
  }

  return insert(db, "book", { ...insertData, ...data })
}

export const addTagsToBookIfNotExist = async (
  db: createNano.DocumentScope<unknown>,
  bookId: string,
  tagIds: readonly string[],
) => {
  if (tagIds.length === 0) return [null, null] as const

  const [bookUpdate, tagUpdate] = await Promise.all([
    atomicUpdate(db, "book", bookId, (old) => {
      const tags = old.tags.find((tag) => tagIds.includes(tag))
        ? old.tags
        : [...old.tags.filter((tag) => !tagIds.includes(tag)), ...tagIds]

      return {
        ...old,
        tags,
      }
    }),
    Promise.all(
      tagIds.map((tagId) =>
        atomicUpdate(db, "tag", tagId, (old) => {
          const books = old.books.find((id) => id === bookId)
            ? old.books
            : [...old.books.filter((id) => id !== bookId), bookId]

          return {
            ...old,
            books,
          }
        }),
      ),
    ),
  ])

  return [bookUpdate, tagUpdate] as const
}

/**
 * Attach or create and attach given tags to the book.
 * The tag is automatically retrieved from name or created if it does not exist.
 */
// export const addTagsFromNameToBook = async (db: createNano.DocumentScope<unknown>, bookId: string, tagNames: string[]) => {
//   if (tagNames.length === 0) return
//   // Get all tag ids and create one if it does not exist
//   const tagIds = await Promise.all(tagNames.map(async (name) => getOrCreateTagFromName(db, name)))

//   return await addTagsToBook(db, bookId, tagIds)
// }

export const getOrCreateTagFromName = (
  db: createNano.DocumentScope<unknown>,
  name: string,
) => {
  return retryFn(async () => {
    // Get all tag ids and create one if it does not exist
    const existingTag = await findOne("tag", { selector: { name } }, { db })
    if (existingTag) {
      return existingTag._id
    }
    const insertedTag = await insert(db, "tag", {
      isProtected: false,
      books: [],
      name,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      rxdbMeta: {
        lwt: Date.now(),
      },
    })

    return insertedTag.id
  })
}

/**
 *
 * @param silent Will not throw an exception if the tag already exists and return its id.
 * @returns
 */
export const createTagFromName = (
  db: createNano.DocumentScope<unknown>,
  name: string,
  silent: boolean,
) => {
  return retryFn(async () => {
    const existingTag = await findOne("tag", { selector: { name } }, { db })

    if (existingTag) {
      if (silent) {
        return { id: existingTag._id, created: false }
      }
      throw new Error(`Tag already exists`)
    }

    const insertedTag = await insert(db, "tag", {
      isProtected: false,
      books: [],
      name,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      rxdbMeta: {
        lwt: Date.now(),
      },
    })

    return { id: insertedTag.id, created: true }
  })
}

export const addLinkToBookIfNotExist = async (
  db: createNano.DocumentScope<unknown>,
  bookId: string,
  linkId: string,
) => {
  const [bookUpdate, linkUpdate] = await Promise.all([
    atomicUpdate(db, "book", bookId, (old) => {
      const links = old.links.find((id) => id === linkId)
        ? old.links
        : [...old.links.filter((id) => id !== linkId), linkId]

      return {
        ...old,
        links,
      }
    }),
    atomicUpdate(db, "link", linkId, (old) => ({
      ...old,
      book: bookId,
    })),
  ])

  return bookUpdate || linkUpdate
}

export const retryFn = async <T>(fn: () => Promise<T>, retry = 100) => {
  let currentRetry = retry

  const retryable = async (): Promise<T> => {
    try {
      return await fn()
    } catch (e) {
      if (
        ((e as any)?.message === "error happened in your connection" ||
          (e as any)?.statusCode >= 500 ||
          (e as any)?.statusCode === 409) &&
        currentRetry > 0
      ) {
        await waitForRandomTime(1, 200)
        currentRetry--
        return await retryable()
      }
      throw e
    }
  }

  return await retryable()
}
