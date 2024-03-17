import createNano from "nano"
import { generateAdminToken, generateToken } from "../auth"
import {
  SafeMangoQuery,
  InsertAbleBookDocType,
  ReadingStateState,
  DocType,
  ModelOf
} from "@oboku/shared"
import { User } from "../couchDbEntities"
import { waitForRandomTime } from "../utils"
import { COUCH_DB_URL } from "../../constants"
import { generatePassword } from "../authentication/generatePassword"

export const createUser = async (
  db: createNano.ServerScope,
  username: string,
  password: string
) => {
  const obokuDb = db.use("_users")
  const newUser = new User(`org.couchdb.user:${username}`, username, password)

  return await obokuDb.insert(newUser, newUser._id)
}

export const getOrCreateUserFromEmail = async (
  db: createNano.ServerScope,
  email: string
) => {
  const usersDb = db.use<User>("_users")

  const {
    docs: [user]
  } = await usersDb.find({
    selector: {
      email
    }
  })

  if (user) return user

  const generatedPassword = generatePassword()

  const { ok } = await createUser(db, email, generatedPassword)

  if (!ok) throw new Error("Error when creating user")

  const {
    docs: [createdUser]
  } = await usersDb.find({
    selector: {
      email
    }
  })

  return createdUser
}

export async function atomicUpdate<
  M extends DocType["rx_model"],
  K extends ModelOf<M>
>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  id: string,
  cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>
) {
  return retryFn(async () => {
    const doc = (await db.get(id)) as createNano.DocumentGetResponse & K
    const { rx_model, ...rest } = cb(doc)
    if (rxModel !== doc.rx_model) throw new Error("Invalid document type")

    return await db.insert({ ...rest, rx_model, _rev: doc._rev, _id: doc._id })
  })
}

export const insert = async <
  M extends DocType["rx_model"],
  D extends ModelOf<M>
>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  data: Omit<D, "rx_model" | "_id" | "_rev">
) => {
  const finalData = { ...data, rx_model: rxModel }

  const doc = await db.insert(finalData as any)

  if (!doc.ok) throw new Error("Unable to create document")

  return doc
}

export const findOne = async <
  M extends DocType["rx_model"],
  D extends ModelOf<M>
>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  query: SafeMangoQuery<D>
) => {
  const { fields, ...restQuery } = query
  const fieldsWithRequiredFields = fields
  if (Array.isArray(fieldsWithRequiredFields)) {
    fieldsWithRequiredFields.push(`rx_model`)
  }
  const response = await retryFn(() =>
    db.find({
      ...restQuery,
      fields: fields as string[],
      selector: { rx_model: rxModel, ...(query?.selector as any) },
      limit: 1
    })
  )

  if (response.docs.length === 0) return null

  const doc = response
    .docs[0] as createNano.MangoResponse<unknown>["docs"][number] & D

  if (rxModel !== doc.rx_model) throw new Error(`Invalid document type`)

  return doc
}

export const find = async <M extends DocType["rx_model"], D extends DocType>(
  db: createNano.DocumentScope<unknown>,
  rxModel: M,
  query: SafeMangoQuery<D>
) => {
  const { fields, ...restQuery } = query
  const response = await retryFn(() =>
    db.find({
      ...restQuery,
      fields: fields as string[],
      selector: { rx_model: rxModel, ...(query?.selector as any) }
    })
  )

  return response.docs
}

export const createBook = async (
  db: createNano.DocumentScope<unknown>,
  data: Partial<InsertAbleBookDocType> = {}
) => {
  const insertData: InsertAbleBookDocType = {
    collections: [],
    createdAt: new Date().getTime(),
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
    rxdbMeta: { lwt: new Date().getTime() },
    ...data
  }

  return insert(db, "book", { ...insertData, ...data })
}

export const addTagsToBook = async (
  db: createNano.DocumentScope<unknown>,
  bookId: string,
  tagIds: string[]
) => {
  if (tagIds.length === 0) return
  return Promise.all([
    atomicUpdate(db, "book", bookId, (old) => ({
      ...old,
      tags: [...old.tags.filter((tag) => !tagIds.includes(tag)), ...tagIds]
    })),
    ...tagIds.map((tagId) =>
      atomicUpdate(db, "tag", tagId, (old) => ({
        ...old,
        books: [...old.books.filter((id) => id !== bookId), bookId]
      }))
    )
  ])
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
  name: string
) => {
  return retryFn(async () => {
    // Get all tag ids and create one if it does not exist
    const existingTag = await findOne(db, "tag", { selector: { name } })
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
        lwt: new Date().getTime()
      }
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
  silent: boolean
) => {
  return retryFn(async () => {
    const existingTag = await findOne(db, "tag", { selector: { name } })

    if (existingTag) {
      if (silent) {
        return { id: existingTag._id, created: false }
      } else {
        throw new Error(`Tag already exists`)
      }
    }

    const insertedTag = await insert(db, "tag", {
      isProtected: false,
      books: [],
      name,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      rxdbMeta: {
        lwt: new Date().getTime()
      }
    })

    return { id: insertedTag.id, created: true }
  })
}

export const addLinkToBook = async (
  db: createNano.DocumentScope<unknown>,
  bookId: string,
  linkId: string
) => {
  return Promise.all([
    atomicUpdate(db, "book", bookId, (old) => {
      return {
        ...old,
        links: [...old.links.filter((id) => id !== linkId), linkId]
      }
    }),
    atomicUpdate(db, "link", linkId, (old) => ({
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

export const getNanoDbForUser = async (name: string, privateKey: string) => {
  const hexEncodedUserId = Buffer.from(name).toString("hex")

  const db = await getNano({
    jwtToken: await generateToken(name, privateKey)
  })

  return db.use(`userdb-${hexEncodedUserId}`)
}

export const getNano = async ({ jwtToken }: { jwtToken?: string } = {}) => {
  return createNano({
    url: COUCH_DB_URL,
    // log: (...args) => console.log('nano', JSON.stringify(...args)),
    requestDefaults: {
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(jwtToken && {
          Authorization: `Bearer ${jwtToken}`
        })
      }
    } as any
  })
}

/**
 * WARNING: be very careful when using nano as admin since you will have full power.
 * As you know with great power comes great responsibilities
 */
export const getAdminNano = async (options: {
  sub?: string
  privateKey: string
}) => {
  return getNano({ jwtToken: await generateAdminToken(options) })
}

export const auth = async (username: string, userpass: string) => {
  const db = await getNano()

  try {
    const response = await db.auth(username, userpass)
    if (!response.ok || !response.name) {
      return null
    }
    return response
  } catch (e) {
    if ((e as any)?.statusCode === 401) return null
    throw e
  }
}
