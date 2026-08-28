import type createNano from "nano"
import { addTagsToBookIfNotExist } from "./dbHelpers"

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
