import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, onTestFinished } from "vitest"
import { openAppTestDatabase } from "./appDatabase.fixture"
import type { Database } from "./databases.shared"
import { reopenDatabase, useDatabase, useReCreateDb } from "./RxDbProvider"

const tagNamed = (name: string) => ({
  name,
  isProtected: false,
  books: [],
  createdAt: new Date().toISOString(),
  modifiedAt: null,
})

const removeWhenTestFinishes = (database: Database) => {
  onTestFinished(async function removeDatabase() {
    await database.remove()
  })
}

const findTagNames = async (database: Database) => {
  const tags = await database.tag.find().exec()

  return tags.map((tag) => tag.name)
}

describe("reopenDatabase", () => {
  it("closes the open instance and opens a new one over the stored data", async () => {
    const { database: staleDatabase, wrapper } = await openAppTestDatabase()
    await staleDatabase.tag.insertSafe(tagNamed("fantasy"))
    const { result, unmount } = renderHook(useDatabase, { wrapper })
    onTestFinished(unmount)

    const database = await reopenDatabase()
    removeWhenTestFinishes(database)

    expect(database).not.toBe(staleDatabase)
    expect(staleDatabase.closed).toBe(true)
    await waitFor(function expectReopenedDatabase() {
      expect(result.current.db).toBe(database)
    })
    expect(await findTagNames(database)).toEqual(["fantasy"])
  })

  it("makes a write through a document of the closed instance fail", async () => {
    const { database: staleDatabase } = await openAppTestDatabase()
    const staleTag = await staleDatabase.tag.insertSafe(tagNamed("fantasy"))

    const database = await reopenDatabase()
    removeWhenTestFinishes(database)

    expect(function editThroughTheStaleDocument() {
      return staleTag.incrementalPatch({ name: "edited in the stale tab" })
    }).toThrow(expect.objectContaining({ code: "COL21" }))
    expect(await findTagNames(database)).toEqual(["fantasy"])
  })

  it("leaves the tab without a database while it waits for another tab that opens or removes the database", async () => {
    const { database: staleDatabase, wrapper } = await openAppTestDatabase()
    const { result, unmount } = renderHook(useDatabase, { wrapper })
    onTestFinished(unmount)
    const otherTabHoldsTheLock = Promise.withResolvers<void>()
    const otherTabWork = Promise.withResolvers<void>()
    const otherTab = navigator.locks.request(
      "oboku-rxdb-lifecycle",
      async function holdTheLock() {
        otherTabHoldsTheLock.resolve()
        await otherTabWork.promise
      },
    )
    await otherTabHoldsTheLock.promise

    const reopening = reopenDatabase()

    await waitFor(function expectNoDatabase() {
      expect(result.current.db).toBeUndefined()
    })
    const { pending: pendingLocks = [] } = await navigator.locks.query()
    expect(pendingLocks.map((lock) => lock.name)).toContain(
      "oboku-rxdb-lifecycle",
    )
    expect(staleDatabase.closed).toBe(false)

    otherTabWork.resolve()
    await otherTab
    const database = await reopening
    removeWhenTestFinishes(database)

    expect(staleDatabase.closed).toBe(true)
    await waitFor(function expectReopenedDatabase() {
      expect(result.current.db).toBe(database)
    })
  })
})

describe("useReCreateDb", () => {
  it("removes the stored data when the tab holds no database", async () => {
    const { database: closedDatabase, wrapper } = await openAppTestDatabase()
    await closedDatabase.tag.insertSafe(tagNamed("fantasy"))
    await closedDatabase.close()
    const { result, unmount } = renderHook(
      function renderReCreateDbAndDatabase() {
        return { reCreateDb: useReCreateDb(), database: useDatabase() }
      },
      { wrapper },
    )
    onTestFinished(unmount)
    expect(result.current.database.db).toBeUndefined()

    await result.current.reCreateDb.mutateAsync({ overwrite: true })

    await waitFor(function expectNewDatabase() {
      expect(result.current.database.db).toBeDefined()
    })
    const database = result.current.database.db
    if (!database) throw new Error("The database did not open")
    removeWhenTestFinishes(database)

    expect(await findTagNames(database)).toEqual([])
  })
})
