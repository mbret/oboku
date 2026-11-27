import type { Mock } from "vitest"
import { Test, type TestingModule } from "@nestjs/testing"
import { getBookCoverKey, getCollectionCoverKey } from "@oboku/shared"
import { CouchService } from "../couch/couch.service.js"
import { CoversCleanupService } from "./covers-cleanup.service.js"
import { CoversService } from "./covers.service.js"

const USER_EMAIL = "reader@example.com"
const USER_NAME_HEX = Buffer.from(USER_EMAIL).toString("hex")
const USER_DB_NAME = `userdb-${USER_NAME_HEX}`

const BOOK_COVER = getBookCoverKey(USER_NAME_HEX, "book-1")
const COLLECTION_COVER = getCollectionCoverKey(USER_NAME_HEX, "series-1")
const COLLECTION_WITHOUT_COVER = getCollectionCoverKey(USER_NAME_HEX, "shelf-1")
const DELETED_BOOK_COVER = getBookCoverKey(USER_NAME_HEX, "deleted-book")

const storedCover = (key: string) => ({
  key,
  sizeInBytes: 1024,
  lastModifiedAt: "2026-01-01T00:00:00.000Z",
})

describe("CoversCleanupService.cleanupDanglingCovers", () => {
  let service: CoversCleanupService
  let deleteCovers: Mock

  beforeEach(async () => {
    deleteCovers = vi.fn(async (keys: string[]) => ({
      deletedKeys: keys,
      failedKeys: [],
    }))

    const findInUserDb = vi.fn(async ({ selector }) => ({
      docs:
        selector.rx_model === "book"
          ? [{ _id: "book-1" }]
          : [
              { _id: "series-1", metadata: [{ cover: { uri: "cover.jpg" } }] },
              { _id: "shelf-1", metadata: [{ title: "Shelf" }] },
            ],
    }))
    const adminNano = {
      use: vi.fn((dbName: string) =>
        dbName === "_users"
          ? {
              find: vi.fn().mockResolvedValue({ docs: [{ name: USER_EMAIL }] }),
            }
          : { find: findInUserDb },
      ),
      db: { list: vi.fn().mockResolvedValue([USER_DB_NAME]) },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoversCleanupService,
        {
          provide: CouchService,
          useValue: {
            createAdminNanoInstance: vi.fn().mockResolvedValue(adminNano),
          },
        },
        {
          provide: CoversService,
          useValue: {
            appConfig: {
              COVERS_STORAGE_STRATEGY: "fs",
              COVERS_CLEANUP_GRACE_PERIOD_MS: 0,
            },
            listStoredCovers: vi
              .fn()
              .mockResolvedValue(
                [
                  BOOK_COVER,
                  COLLECTION_COVER,
                  COLLECTION_WITHOUT_COVER,
                  DELETED_BOOK_COVER,
                ].map(storedCover),
              ),
            deleteCovers,
          },
        },
      ],
    }).compile()

    service = module.get(CoversCleanupService)
  })

  it("deletes only the covers that no book or collection of a user keeps", async () => {
    await service.cleanupDanglingCovers()

    expect(deleteCovers.mock.calls).toEqual([
      [[COLLECTION_WITHOUT_COVER, DELETED_BOOK_COVER]],
    ])
  })
})
