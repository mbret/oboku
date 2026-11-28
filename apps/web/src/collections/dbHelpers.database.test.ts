import { createBookDefaults } from "@oboku/shared"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { openTestDatabase } from "../rxdb/databases.fixture"
import { observeEmptyCollection } from "./dbHelpers"

describe("observeEmptyCollection", () => {
  it("lists a book in no collection and a book whose collections the device does not hold, and leaves out a book in a held collection", async () => {
    const database = await openTestDatabase()
    const heldCollection = await database.obokucollection.post({
      books: [],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })
    const bookInNoCollection = await database.book.post(createBookDefaults())
    const bookOfMissingCollection = await database.book.post({
      ...createBookDefaults(),
      collections: ["missing-collection"],
    })
    await database.book.post({
      ...createBookDefaults(),
      collections: [heldCollection._id, "missing-collection"],
    })

    const emptyCollection = await firstValueFrom(
      observeEmptyCollection({
        db: database,
        id: "books-without-collection",
        includeProtected: true,
      }),
    )

    expect(emptyCollection.books.toSorted()).toEqual(
      [bookInNoCollection._id, bookOfMissingCollection._id].toSorted(),
    )
  })

  it("leaves out a book once its collection reaches the device", async () => {
    const database = await openTestDatabase()
    const book = await database.book.post({
      ...createBookDefaults(),
      collections: ["collection-not-received-yet"],
    })
    const onEmptyCollection = vi.fn()
    const subscription = observeEmptyCollection({
      db: database,
      id: "books-without-collection",
      includeProtected: true,
    }).subscribe(onEmptyCollection)
    onTestFinished(function stopObservingEmptyCollection() {
      subscription.unsubscribe()
    })
    await vi.waitFor(function expectBookWithoutCollection() {
      expect(onEmptyCollection).toHaveBeenLastCalledWith(
        expect.objectContaining({ books: [book._id] }),
      )
    })

    await database.obokucollection.insert({
      _id: "collection-not-received-yet",
      _rev: "",
      rxdbMeta: { lwt: 0 },
      rx_model: "obokucollection",
      books: [book._id],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })

    await vi.waitFor(function expectNoBookWithoutCollection() {
      expect(onEmptyCollection).toHaveBeenLastCalledWith(
        expect.objectContaining({ books: [] }),
      )
    })
  })
})
