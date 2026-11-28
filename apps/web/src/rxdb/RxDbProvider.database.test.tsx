import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { openAppTestDatabase } from "./appDatabase.fixture"
import { withDatabaseLifecycleLock } from "./databaseLifecycleLock.shared"
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

/**
 * Holds the database lifecycle lock, as another tab does while it opens or
 * removes the database. Resolves with the function that releases the lock,
 * which also runs when the test finishes.
 */
const holdLifecycleLockAsAnotherTab = async () => {
  const lockIsHeld = Promise.withResolvers<void>()
  const otherTabWork = Promise.withResolvers<void>()
  const otherTab = withDatabaseLifecycleLock(async function holdTheLock() {
    lockIsHeld.resolve()
    await otherTabWork.promise
  })
  await lockIsHeld.promise

  const releaseLock = async () => {
    otherTabWork.resolve()
    await otherTab
  }
  onTestFinished(releaseLock)

  return releaseLock
}

const isARequestWaitingForAHeldLock = async () => {
  const { held = [], pending = [] } = await navigator.locks.query()
  const heldLockNames = held.map((lock) => lock.name)

  return pending.some((lock) => heldLockNames.includes(lock.name))
}

const waitForARequestBehindAHeldLock = () =>
  waitFor(async function expectARequestBehindAHeldLock() {
    expect(await isARequestWaitingForAHeldLock()).toBe(true)
  })

const renderReCreateDbAndDatabase = (
  wrapper: Awaited<ReturnType<typeof openAppTestDatabase>>["wrapper"],
) => {
  const recordGivenDatabase = vi.fn<(database: Database | undefined) => void>()
  const { result, unmount } = renderHook(
    function useReCreateDbAndDatabase() {
      const { db } = useDatabase()

      recordGivenDatabase(db)

      return { reCreateDb: useReCreateDb(), database: db }
    },
    { wrapper },
  )
  onTestFinished(unmount)

  return {
    result,
    findGivenDatabases: () =>
      recordGivenDatabase.mock.calls.map(([database]) => database),
  }
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
    const releaseOtherTabLock = await holdLifecycleLockAsAnotherTab()

    const reopening = reopenDatabase()

    await waitFor(function expectNoDatabase() {
      expect(result.current.db).toBeUndefined()
    })
    await waitForARequestBehindAHeldLock()
    expect(staleDatabase.closed).toBe(false)

    await releaseOtherTabLock()
    const database = await reopening
    removeWhenTestFinishes(database)

    expect(staleDatabase.closed).toBe(true)
    await waitFor(function expectReopenedDatabase() {
      expect(result.current.db).toBe(database)
    })
  })

  it("gives no database between a reopen and a removal that waited for another tab", async () => {
    const { database: staleDatabase, wrapper } = await openAppTestDatabase()
    const { result, findGivenDatabases } = renderReCreateDbAndDatabase(wrapper)
    const releaseOtherTabLock = await holdLifecycleLockAsAnotherTab()

    const reopening = reopenDatabase()
    const removing = result.current.reCreateDb.mutateAsync({ overwrite: true })
    await releaseOtherTabLock()
    const reopenedDatabase = await reopening
    const database = await removing
    removeWhenTestFinishes(database)

    await waitFor(function expectDatabaseOpenedAfterTheRemoval() {
      expect(result.current.database).toBe(database)
    })
    expect(staleDatabase.closed).toBe(true)
    expect(reopenedDatabase.closed).toBe(true)
    expect(findGivenDatabases()).not.toContain(reopenedDatabase)
  })
})

describe("useReCreateDb", () => {
  it("removes the stored data when the tab holds no database", async () => {
    const { database: closedDatabase, wrapper } = await openAppTestDatabase()
    await closedDatabase.tag.insertSafe(tagNamed("fantasy"))
    await closedDatabase.close()
    const { result } = renderReCreateDbAndDatabase(wrapper)
    expect(result.current.database).toBeUndefined()

    const database = await result.current.reCreateDb.mutateAsync({
      overwrite: true,
    })
    removeWhenTestFinishes(database)

    await waitFor(function expectNewDatabase() {
      expect(result.current.database).toBe(database)
    })
    expect(await findTagNames(database)).toEqual([])
  })

  it("closes the instance that the tab holds, then removes the stored data", async () => {
    const { database: staleDatabase, wrapper } = await openAppTestDatabase()
    await staleDatabase.tag.insertSafe(tagNamed("fantasy"))
    const { result } = renderReCreateDbAndDatabase(wrapper)

    const database = await result.current.reCreateDb.mutateAsync({
      overwrite: true,
    })
    removeWhenTestFinishes(database)

    expect(database).not.toBe(staleDatabase)
    expect(staleDatabase.closed).toBe(true)
    await waitFor(function expectNewDatabase() {
      expect(result.current.database).toBe(database)
    })
    expect(await findTagNames(database)).toEqual([])
  })

  it("opens no second instance while the open database waits for its replacement", async () => {
    const { database: staleDatabase, wrapper } = await openAppTestDatabase()
    const { result } = renderReCreateDbAndDatabase(wrapper)
    const releaseOtherTabLock = await holdLifecycleLockAsAnotherTab()

    const opening = result.current.reCreateDb.mutateAsync({ overwrite: false })
    await waitForARequestBehindAHeldLock()
    const reopening = reopenDatabase()
    await releaseOtherTabLock()

    expect(await opening).toBe(staleDatabase)
    const database = await reopening
    removeWhenTestFinishes(database)
    expect(staleDatabase.closed).toBe(true)
    await waitFor(function expectReopenedDatabase() {
      expect(result.current.database).toBe(database)
    })
  })
})
