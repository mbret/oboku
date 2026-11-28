import { firstValueFrom, Subject } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import type { CoversService } from "../../covers/covers.service.js"
import type {
  SynchronizeAbleItem,
  SynchronizeAbleLibrarySync,
} from "../../plugins/types.js"
import { SyncReport } from "./SyncReport.js"
import { synchronizeFromLibrarySync } from "./synchronizeFromLibrarySync.js"
import type { Context } from "./types.js"

const fileNamed = (name: string): SynchronizeAbleItem => ({
  type: "file",
  name,
  modifiedAt: "2026-11-01T10:00:00.000Z",
  linkData: { fileId: name },
})

const folderOfTwoBooks: SynchronizeAbleLibrarySync = {
  items: [
    {
      type: "folder",
      name: "Fantasy [oboku~no_collection]",
      modifiedAt: "2026-11-01T10:00:00.000Z",
      linkData: { fileId: "fantasy" },
      items: [fileNamed("failing.epub"), fileNamed("slow.epub")],
    },
  ],
}

describe("synchronizeFromLibrarySync", () => {
  it("waits for every item to finish before it fails", async () => {
    const lookupFailure = new Error("The lookup failed")
    const slowLookup = new Subject<never>()
    const getLinkCandidatesForItem = vi.fn(function lookUpLinks(
      item: SynchronizeAbleItem,
    ) {
      return item.name === "slow.epub"
        ? firstValueFrom(slowLookup)
        : Promise.reject(lookupFailure)
    })
    // Both books fail at the link lookup, so the sync reads nothing else from
    // its context.
    const ctx = {
      plugin: { getLinkCandidatesForItem },
      syncReport: new SyncReport("library-sync", "reader@example.com"),
    } as unknown as Context
    // The sync fails before it reads a cover.
    const coversService = {} as unknown as CoversService
    const recordFailure = vi.fn<(error: unknown) => void>()

    const syncing = synchronizeFromLibrarySync(
      folderOfTwoBooks,
      ctx,
      coversService,
    ).catch(recordFailure)
    await vi.waitFor(function expectBothLookupsStarted() {
      expect(getLinkCandidatesForItem).toHaveBeenCalledTimes(2)
    })
    await new Promise(setImmediate)

    expect(recordFailure).not.toHaveBeenCalled()

    slowLookup.error(new Error("The slow lookup failed"))
    await syncing

    expect(recordFailure).toHaveBeenCalledExactlyOnceWith(lookupFailure)
  })
})
