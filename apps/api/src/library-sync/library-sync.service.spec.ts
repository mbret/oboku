import type { EventEmitter2 } from "@nestjs/event-emitter"
import type createNano from "nano"
import { firstValueFrom, Subject } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AuthUser } from "../auth/auth.guard.js"
import type { CouchService } from "../couch/couch.service.js"
import type { CoversService } from "../covers/covers.service.js"
import type { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import type { NotificationsService } from "../notifications/notifications.service.js"
import type { SynchronizeAbleItem } from "../plugins/types.js"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"

const { readSource, lookUpLinks } = vi.hoisted(function createPluginSpies() {
  return { readSource: vi.fn(), lookUpLinks: vi.fn() }
})

vi.mock("../plugins/plugins.js", function mockPlugins() {
  return {
    getPlugin: () => ({
      type: "URI",
      sync: readSource,
      getLinkCandidatesForItem: lookUpLinks,
    }),
  }
})

import { LibrarySyncService } from "./library-sync.service.js"

const READER: AuthUser = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: 1,
  email: "reader@example.com",
  "couchdb.roles": [],
}

const librarySyncNamed = (_id: string) => ({
  _id,
  _rev: "1-a",
  rx_model: "datasource",
  type: "URI",
  tags: [],
})

const readerDatabase = {
  find: async (query: createNano.MangoQuery) => ({
    docs: [librarySyncNamed(String(query.selector._id))],
  }),
  get: async (id: string) => librarySyncNamed(id),
  insert: async (doc: { _id: string }) => ({
    ok: true,
    id: doc._id,
    rev: "2-b",
  }),
}

const folderOfOneBook = (bookName: string): SynchronizeAbleItem => ({
  type: "folder",
  name: "Fantasy [oboku~no_collection]",
  modifiedAt: "2026-11-01T10:00:00.000Z",
  linkData: { fileId: "fantasy" },
  items: [
    {
      type: "file",
      name: bookName,
      modifiedAt: "2026-11-01T10:00:00.000Z",
      linkData: { fileId: bookName },
    },
  ],
})

const createService = () => {
  const service = new LibrarySyncService(
    // The syncs of these tests fail at the link lookup, before they read a
    // cover or emit an event.
    {} as unknown as CoversService,
    { save: vi.fn(async () => {}) } as unknown as SyncReportPostgresService,
    {
      sendSyncFinishedNotification: vi.fn(async () => {}),
    } as unknown as NotificationsService,
    {} as unknown as EventEmitter2,
    {
      createNanoInstanceForUser: async () => readerDatabase,
    } as unknown as CouchService,
    new InMemoryTaskQueueService(),
  )
  service.onModuleInit()

  return service
}

describe("LibrarySyncService", () => {
  beforeEach(() => {
    readSource.mockReset()
    lookUpLinks.mockReset()
    readSource.mockImplementation(async function listOneBook({
      dataSourceId,
    }: {
      dataSourceId: string
    }) {
      return { items: [folderOfOneBook(`${dataSourceId}.epub`)] }
    })
  })

  it("reads the source of a library sync while another one of the user writes, and writes after it", async () => {
    const firstLookup = new Subject<never>()
    lookUpLinks.mockImplementation(function lookUpLinksOf(
      item: SynchronizeAbleItem,
    ) {
      return item.name === "library-sync-a.epub"
        ? firstValueFrom(firstLookup)
        : Promise.reject(new Error("The second lookup failed"))
    })
    const service = createService()
    const recordFailure = vi.fn<(error: unknown) => void>()

    const firstSync = service
      .sync({
        dataSourceId: "library-sync-a",
        providerCredentials: {},
        user: READER,
      })
      .catch(recordFailure)
    await vi.waitFor(function expectFirstSyncWrites() {
      expect(lookUpLinks).toHaveBeenCalledTimes(1)
    })

    const secondSync = service
      .sync({
        dataSourceId: "library-sync-b",
        providerCredentials: {},
        user: READER,
      })
      .catch(recordFailure)
    await vi.waitFor(function expectSecondSyncReadItsSource() {
      expect(readSource).toHaveBeenCalledTimes(2)
    })
    await new Promise(setImmediate)

    expect(lookUpLinks).toHaveBeenCalledTimes(1)

    firstLookup.error(new Error("The first lookup failed"))
    await firstSync
    await secondSync

    expect(lookUpLinks).toHaveBeenCalledTimes(2)
    expect(lookUpLinks).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "library-sync-b.epub" }),
      expect.anything(),
    )
  })
})
