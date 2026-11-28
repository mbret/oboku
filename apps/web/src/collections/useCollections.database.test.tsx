import { createBookDefaults } from "@oboku/shared"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { openAppTestDatabase } from "../rxdb/appDatabase.fixture"
import { useCollections } from "./useCollections"

describe("useCollections", () => {
  it("hides a collection whose only held book is not interested, even when it lists the id of a missing book", async () => {
    const { database, wrapper } = await openAppTestDatabase()
    const notInterestedBook = await database.book.post({
      ...createBookDefaults(),
      isNotInterested: true,
    })
    const interestedBook = await database.book.post(createBookDefaults())
    await database.obokucollection.post({
      books: [notInterestedBook._id, "deleted-book"],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })
    const collectionOfInterestedBook = await database.obokucollection.post({
      books: [interestedBook._id],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })

    const { result, unmount } = renderHook(
      function renderUseCollections() {
        return useCollections({ isNotInterested: "none" })
      },
      { wrapper },
    )
    onTestFinished(unmount)

    await vi.waitFor(function expectOnlyTheInterestedCollection() {
      expect(result.current.data?.map(({ _id }) => _id)).toEqual([
        collectionOfInterestedBook._id,
      ])
    })
  })
})
