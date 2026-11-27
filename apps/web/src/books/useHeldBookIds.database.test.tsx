import { createBookDefaults } from "@oboku/shared"
import { renderHook } from "@testing-library/react"
import type { DeepReadonlyArray } from "rxdb"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { openAppTestDatabase } from "../rxdb/appDatabase.fixture"
import { useHeldBookIds } from "./useHeldBookIds"

describe("useHeldBookIds", () => {
  it("returns the ids of the books the device holds, in the order of the ids, and leaves out the id of a missing book", async () => {
    const { database, wrapper } = await openAppTestDatabase()
    const firstBook = await database.book.post(createBookDefaults())
    const secondBook = await database.book.post(createBookDefaults())
    const ids = [secondBook._id, "deleted-book", firstBook._id]

    const { result, unmount } = renderHook(
      function renderUseHeldBookIds() {
        return useHeldBookIds(ids)
      },
      { wrapper },
    )
    onTestFinished(unmount)

    await vi.waitFor(function expectHeldBookIds() {
      expect(result.current).toEqual([secondBook._id, firstBook._id])
    })
  })

  it("keeps a protected book while the library is locked", async () => {
    const { database, wrapper } = await openAppTestDatabase()
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

    const { result, unmount } = renderHook(
      function renderUseHeldBookIds() {
        return useHeldBookIds(ids)
      },
      { wrapper },
    )
    onTestFinished(unmount)

    await vi.waitFor(function expectProtectedBookId() {
      expect(result.current).toEqual([protectedBook._id])
    })
  })

  it("follows new ids in the same render, without the books of the previous ids", async () => {
    const { database, wrapper } = await openAppTestDatabase()
    const firstBook = await database.book.post(createBookDefaults())
    const secondBook = await database.book.post(createBookDefaults())

    const { result, rerender, unmount } = renderHook<
      string[] | undefined,
      { ids: DeepReadonlyArray<string> | undefined }
    >(
      function renderUseHeldBookIds({ ids }) {
        return useHeldBookIds(ids)
      },
      { wrapper, initialProps: { ids: [firstBook._id] } },
    )
    onTestFinished(unmount)
    await vi.waitFor(function expectFirstBookId() {
      expect(result.current).toEqual([firstBook._id])
    })

    rerender({ ids: [secondBook._id, "deleted-book"] })
    expect(result.current).toEqual([secondBook._id])

    rerender({ ids: undefined })
    expect(result.current).toBeUndefined()
  })
})
