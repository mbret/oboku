import { createBookDefaults } from "@oboku/shared"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { createDatabaseForTest } from "../rxdb/createDatabaseForTest"
import { useExistingBookIds } from "./useExistingBookIds"

describe("useExistingBookIds", () => {
  it("resolves with the ids of the books the device holds, in the order of the ids, and leaves out the id of a missing book", async () => {
    const { database, wrapper } = await createDatabaseForTest()
    const firstBook = await database.book.post(createBookDefaults())
    const secondBook = await database.book.post(createBookDefaults())
    const ids = [secondBook._id, "deleted-book", firstBook._id]

    const { result } = renderHook(
      function renderUseExistingBookIds() {
        return useExistingBookIds(ids)
      },
      { wrapper },
    )

    await vi.waitFor(function expectHeldBookIds() {
      expect(result.current.data).toEqual([secondBook._id, firstBook._id])
    })
  })

  it("keeps a protected book while the library is locked", async () => {
    const { database, wrapper } = await createDatabaseForTest()
    const protectedTag = await database.tag.insertSafe({
      name: "private",
      isProtected: true,
      books: [],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })
    const protectedBook = await database.book.post({
      ...createBookDefaults(),
      tags: [protectedTag._id],
    })
    const ids = [protectedBook._id]

    const { result } = renderHook(
      function renderUseExistingBookIds() {
        return useExistingBookIds(ids)
      },
      { wrapper },
    )

    await vi.waitFor(function expectProtectedBookId() {
      expect(result.current.data).toEqual([protectedBook._id])
    })
  })

  it("does not query the books while the ids are unknown", async () => {
    const { database, wrapper } = await createDatabaseForTest()
    await database.book.post(createBookDefaults())

    const { result } = renderHook(
      function renderUseExistingBookIds() {
        return useExistingBookIds(undefined)
      },
      { wrapper },
    )

    expect(result.current).toMatchObject({
      data: undefined,
      fetchStatus: "idle",
    })
  })
})
