import type createNano from "nano"
import { User } from "../couchDbEntities"
import {
  addTagsToBookIfNotExist,
  doesCouchDatabaseExist,
  touchCouchUser,
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

describe("touchCouchUser", () => {
  const user = new User(
    "org.couchdb.user:reader@example.com",
    "reader@example.com",
    "secret",
  )
  user._rev = "3-abc"

  const createFakeServer = (insert: jest.Mock) =>
    // Only `_users`.insert is exercised; nano's full ServerScope surface is
    // irrelevant to these tests.
    ({ use: () => ({ insert }) }) as unknown as createNano.ServerScope

  it("re-saves the user doc under its own id", async () => {
    const insert = jest.fn().mockResolvedValue({ ok: true })

    await touchCouchUser(createFakeServer(insert), user)

    expect(insert).toHaveBeenCalledWith(user, user._id)
  })

  it("ignores a conflict, which means a concurrent sign-in already re-saved it", async () => {
    const insert = jest.fn().mockRejectedValue(couchError(409, "conflict"))

    await expect(
      touchCouchUser(createFakeServer(insert), user),
    ).resolves.toBeUndefined()
  })

  it("rethrows any other failure", async () => {
    const insert = jest.fn().mockRejectedValue(couchError(401, "unauthorized"))

    await expect(
      touchCouchUser(createFakeServer(insert), user),
    ).rejects.toThrow("unauthorized")
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
