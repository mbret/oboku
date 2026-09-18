import type createNano from "nano"
import { addTagsToBookIfNotExist, getOrCreateUserFromEmail } from "./dbHelpers"
import type { User } from "../couchDbEntities"

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

type StoredCouchUser = {
  _id: string
  _rev: string
  type: "user"
  name: string
  email: string
  roles: string[]
}

const storedCouchUser = (email: string): StoredCouchUser => ({
  _id: `org.couchdb.user:${email}`,
  _rev: "1",
  type: "user",
  name: email,
  email,
  roles: [],
})

const couchNotFoundError = () =>
  Object.assign(new Error("missing"), { statusCode: 404 })

const createFakeCouchServer = (
  users: StoredCouchUser[],
  { getError }: { getError?: Error } = {},
) => {
  const store = new Map(users.map((user) => [user._id, user]))
  const inserted: User[] = []

  const usersDb = {
    get: async (id: string) => {
      if (getError) throw getError
      const doc = store.get(id)
      if (!doc) throw couchNotFoundError()
      return { ...doc }
    },
    find: async ({ selector }: { selector: { type?: string } }) => ({
      docs: [...store.values()].filter((doc) => doc.type === selector.type),
    }),
    insert: async (doc: User, id: string) => {
      inserted.push(doc)
      return { ok: true, id, rev: "1-next" }
    },
  }

  const fakeServer = {
    use: () => usersDb,
    // Only `_users` get/find/insert are exercised by getOrCreateUserFromEmail;
    // nano's full ServerScope surface is irrelevant to these tests.
  } as unknown as createNano.ServerScope

  return { fakeServer, inserted }
}

describe("getOrCreateUserFromEmail", () => {
  it("returns the user whose doc id matches the normalized email", async () => {
    const { fakeServer, inserted } = createFakeCouchServer([
      storedCouchUser("foo@example.com"),
    ])

    const result = await getOrCreateUserFromEmail(
      fakeServer,
      " Foo@Example.com ",
    )

    expect(result.created).toBe(false)
    expect(result.user._id).toBe("org.couchdb.user:foo@example.com")
    expect(inserted).toHaveLength(0)
  })

  it("reuses a legacy user whose doc kept its original casing", async () => {
    const { fakeServer, inserted } = createFakeCouchServer([
      storedCouchUser("Foo@Example.com"),
    ])

    const result = await getOrCreateUserFromEmail(fakeServer, "foo@example.com")

    expect(result.created).toBe(false)
    expect(result.user._id).toBe("org.couchdb.user:Foo@Example.com")
    expect(result.user.name).toBe("Foo@Example.com")
    expect(inserted).toHaveLength(0)
  })

  it("prefers the normalized doc when a legacy casing also exists", async () => {
    const { fakeServer } = createFakeCouchServer([
      storedCouchUser("Foo@Example.com"),
      storedCouchUser("foo@example.com"),
    ])

    const result = await getOrCreateUserFromEmail(fakeServer, "foo@example.com")

    expect(result.user._id).toBe("org.couchdb.user:foo@example.com")
  })

  it("creates the user with the normalized email when none matches", async () => {
    const { fakeServer, inserted } = createFakeCouchServer([
      storedCouchUser("someone-else@example.com"),
    ])

    const result = await getOrCreateUserFromEmail(
      fakeServer,
      " New@Example.com",
    )

    expect(result.created).toBe(true)
    expect(inserted).toHaveLength(1)
    expect(inserted[0]?._id).toBe("org.couchdb.user:new@example.com")
    expect(inserted[0]?.name).toBe("new@example.com")
    expect(inserted[0]?.email).toBe("new@example.com")
  })

  it("rethrows lookup failures other than not found", async () => {
    const couchServerError = Object.assign(new Error("boom"), {
      statusCode: 500,
    })
    const { fakeServer, inserted } = createFakeCouchServer([], {
      getError: couchServerError,
    })

    await expect(
      getOrCreateUserFromEmail(fakeServer, "foo@example.com"),
    ).rejects.toBe(couchServerError)
    expect(inserted).toHaveLength(0)
  })
})
