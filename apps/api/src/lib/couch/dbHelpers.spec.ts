import type createNano from "nano"
import { User } from "../couchDbEntities"
import {
  addTagsToBookIfNotExist,
  doesCouchDatabaseExist,
  getOrCreateUserFromEmail,
} from "./dbHelpers"

type StoredDoc = {
  _id: string
  _rev: string
  rx_model: "book" | "tag"
  tags?: string[]
  books?: string[]
}

const createFakeDb = (docs: StoredDoc[]) => {
  const store = new Map(docs.map((doc) => [doc._id, doc]))
  const inserted: StoredDoc[] = []

  const fakeDb = {
    get: async (id: string) => {
      const doc = store.get(id)
      if (!doc) throw new Error(`missing doc ${id}`)
      return { ...doc }
    },
    insert: async (doc: StoredDoc) => {
      inserted.push(doc)
      store.set(doc._id, doc)
      return { ok: true, id: doc._id, rev: `${doc._rev}-next` }
    },
    // Only get/insert are exercised by atomicUpdate; nano's full
    // DocumentScope surface is irrelevant to these tests.
  } as unknown as createNano.DocumentScope<unknown>

  return { fakeDb, inserted, store }
}

describe("addTagsToBookIfNotExist", () => {
  it("adds the missing tags when the book already has one of them", async () => {
    const { fakeDb, inserted, store } = createFakeDb([
      { _id: "book-1", _rev: "1", rx_model: "book", tags: ["tag-existing"] },
      {
        _id: "tag-existing",
        _rev: "1",
        rx_model: "tag",
        books: ["book-1"],
      },
      { _id: "tag-new", _rev: "1", rx_model: "tag", books: [] },
    ])

    await addTagsToBookIfNotExist(fakeDb, "book-1", ["tag-existing", "tag-new"])

    expect(store.get("book-1")?.tags).toEqual(["tag-existing", "tag-new"])
    expect(store.get("tag-new")?.books).toEqual(["book-1"])
    expect(inserted.filter((doc) => doc._id === "tag-existing")).toHaveLength(0)
  })

  it("does not write the book when it already has every tag", async () => {
    const { fakeDb, inserted } = createFakeDb([
      {
        _id: "book-1",
        _rev: "1",
        rx_model: "book",
        tags: ["tag-a", "tag-b"],
      },
      { _id: "tag-a", _rev: "1", rx_model: "tag", books: ["book-1"] },
      { _id: "tag-b", _rev: "1", rx_model: "tag", books: ["book-1"] },
    ])

    const [bookUpdate] = await addTagsToBookIfNotExist(fakeDb, "book-1", [
      "tag-a",
      "tag-b",
    ])

    expect(bookUpdate).toBeNull()
    expect(inserted).toHaveLength(0)
  })

  it("adds every tag to a book that has none of them", async () => {
    const { fakeDb, store } = createFakeDb([
      { _id: "book-1", _rev: "1", rx_model: "book", tags: [] },
      { _id: "tag-a", _rev: "1", rx_model: "tag", books: [] },
      { _id: "tag-b", _rev: "1", rx_model: "tag", books: [] },
    ])

    await addTagsToBookIfNotExist(fakeDb, "book-1", ["tag-a", "tag-b"])

    expect(store.get("book-1")?.tags).toEqual(["tag-a", "tag-b"])
    expect(store.get("tag-a")?.books).toEqual(["book-1"])
    expect(store.get("tag-b")?.books).toEqual(["book-1"])
  })
})

const couchError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode })

describe("getOrCreateUserFromEmail", () => {
  const email = "reader@example.com"
  const existingUser = new User(`org.couchdb.user:${email}`, email, "secret")
  existingUser._rev = "3-abc"

  const createFakeServer = ({
    users,
    dbExists,
    insert = jest.fn().mockResolvedValue({ ok: true, rev: "4-def" }),
  }: {
    users: User[]
    dbExists: boolean
    insert?: jest.Mock
  }) => {
    const usersDb = {
      find: jest.fn().mockResolvedValue({ docs: users }),
      insert,
    }
    const get = jest.fn(async function getDatabaseIfExists() {
      if (dbExists) return { db_name: "userdb" }
      throw couchError(404, "not_found")
    })

    return {
      // Only `_users` find/insert and `db.get` are exercised; nano's full
      // ServerScope surface is irrelevant to these tests.
      server: {
        use: function useUsersDb() {
          return usersDb
        },
        db: { get },
      } as unknown as createNano.ServerScope,
      usersDb,
    }
  }

  it("returns an existing user whose database exists without rewriting it", async () => {
    const { server, usersDb } = createFakeServer({
      users: [existingUser],
      dbExists: true,
    })

    await expect(getOrCreateUserFromEmail(server, email)).resolves.toEqual({
      user: existingUser,
      userDbPending: false,
    })
    expect(usersDb.insert).not.toHaveBeenCalled()
  })

  it("re-saves an existing user whose database is missing so couch_peruser recreates it", async () => {
    const { server, usersDb } = createFakeServer({
      users: [existingUser],
      dbExists: false,
    })

    await expect(getOrCreateUserFromEmail(server, email)).resolves.toEqual({
      user: existingUser,
      userDbPending: true,
    })
    expect(usersDb.insert).toHaveBeenCalledWith(existingUser, existingUser._id)
  })

  it("treats a conflict on the re-save as a concurrent sign-in having done it", async () => {
    const { server } = createFakeServer({
      users: [existingUser],
      dbExists: false,
      insert: jest.fn().mockRejectedValue(couchError(409, "conflict")),
    })

    await expect(getOrCreateUserFromEmail(server, email)).resolves.toEqual({
      user: existingUser,
      userDbPending: true,
    })
  })

  it("rethrows any other failure of the re-save", async () => {
    const { server } = createFakeServer({
      users: [existingUser],
      dbExists: false,
      insert: jest.fn().mockRejectedValue(couchError(401, "unauthorized")),
    })

    await expect(getOrCreateUserFromEmail(server, email)).rejects.toThrow(
      "unauthorized",
    )
  })

  it("creates the user on first sign-in", async () => {
    const { server, usersDb } = createFakeServer({ users: [], dbExists: false })

    const result = await getOrCreateUserFromEmail(server, email)

    expect(result.userDbPending).toBe(true)
    expect(result.user.name).toBe(email)
    expect(usersDb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: `org.couchdb.user:${email}`,
        name: email,
      }),
      `org.couchdb.user:${email}`,
    )
  })
})

describe("doesCouchDatabaseExist", () => {
  const createFakeServer = (get: jest.Mock) =>
    // Only `db.get` is exercised; nano's full ServerScope surface is
    // irrelevant to these tests.
    ({ db: { get } }) as unknown as createNano.ServerScope

  it("is true when the database answers", async () => {
    const get = jest.fn().mockResolvedValue({ db_name: "userdb-1" })

    await expect(
      doesCouchDatabaseExist(createFakeServer(get), "userdb-1"),
    ).resolves.toBe(true)
  })

  it("is false when the database is missing", async () => {
    const get = jest.fn().mockRejectedValue(couchError(404, "not_found"))

    await expect(
      doesCouchDatabaseExist(createFakeServer(get), "userdb-1"),
    ).resolves.toBe(false)
  })

  it("rethrows any other failure", async () => {
    const get = jest.fn().mockRejectedValue(couchError(401, "unauthorized"))

    await expect(
      doesCouchDatabaseExist(createFakeServer(get), "userdb-1"),
    ).rejects.toThrow("unauthorized")
  })
})
