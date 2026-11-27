import { createBookDefaults } from "@oboku/shared"
import { firstValueFrom } from "rxjs"
import { describe, expect, it } from "vitest"
import { createDatabaseForTest } from "../rxdb/createDatabaseForTest"
import { observeEmptyCollection } from "./dbHelpers"

describe("observeEmptyCollection", () => {
  it("lists a book in no collection and a book whose collections the device does not hold, and leaves out a book in a held collection", async () => {
    const { database } = await createDatabaseForTest()
    const heldCollection = await database.obokucollection.post({
      books: [],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })
    const bookInNoCollection = await database.book.post(createBookDefaults())
    const bookOfDeletedCollection = await database.book.post({
      ...createBookDefaults(),
      collections: ["deleted-collection"],
    })
    await database.book.post({
      ...createBookDefaults(),
      collections: [heldCollection._id, "deleted-collection"],
    })

    const emptyCollection = await firstValueFrom(
      observeEmptyCollection({
        db: database,
        id: "books-without-collection",
        includeProtected: true,
      }),
    )

    expect(emptyCollection.books.toSorted()).toEqual(
      [bookInNoCollection._id, bookOfDeletedCollection._id].toSorted(),
    )
  })
})
