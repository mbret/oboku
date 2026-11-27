import type { Mock } from "vitest"
import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { SettingsDocType } from "@oboku/shared"
import { CouchService } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { RefreshTokenPostgresEntity } from "../features/postgres/entities.js"
import { MigrationService } from "./migration.service.js"

const USER_EMAIL = "reader@example.com"
const USER_DB_NAME = `userdb-${Buffer.from(USER_EMAIL).toString("hex")}`

const couchError = (statusCode: number) =>
  Object.assign(new Error(`couch ${statusCode}`), { statusCode })

const SETTINGS: SettingsDocType & { _rev: string } = {
  _id: "settings",
  _rev: "1-a",
  readerGlobalFontScale: 1.2,
  connectors: [
    {
      id: "nas-webdav",
      type: "webdav",
      url: "192.168.1.10/dav",
      username: "reader",
      passwordAsSecretId: "nas-secret",
      allowSelfSigned: true,
    },
    {
      id: "nas-drive",
      type: "synology-drive",
      url: "  nas.local:5000 ",
      username: "reader",
      passwordAsSecretId: "nas-secret",
    },
    {
      id: "koofr",
      type: "webdav",
      url: "http://nas.local:5005/dav",
      username: "reader",
      passwordAsSecretId: "koofr-secret",
    },
    {
      id: "blank",
      type: "webdav",
      url: "",
      username: "reader",
      passwordAsSecretId: "nas-secret",
    },
    {
      id: "catalog",
      type: "opds",
      url: "catalog.example.com/opds",
      username: "reader",
      passwordAsSecretId: "catalog-secret",
    },
  ],
}

const MIGRATED_CONNECTORS = [
  { ...SETTINGS.connectors?.[0], url: "https://192.168.1.10/dav" },
  { ...SETTINGS.connectors?.[1], url: "https://nas.local:5000" },
  ...(SETTINGS.connectors?.slice(2) ?? []),
]

describe("MigrationService", () => {
  let service: MigrationService
  let findUsers: Mock
  let getUserDoc: Mock
  let insertUserDoc: Mock
  let findUserDocs: Mock
  let bulkUserDocs: Mock

  beforeEach(async () => {
    findUsers = vi.fn().mockResolvedValue({ docs: [{ name: USER_EMAIL }] })
    getUserDoc = vi.fn()
    insertUserDoc = vi.fn().mockResolvedValue({ ok: true })
    findUserDocs = vi.fn().mockResolvedValue({ docs: [] })
    bulkUserDocs = vi.fn().mockResolvedValue([])

    const adminNano = {
      use: vi.fn((dbName: string) =>
        dbName === "_users"
          ? { find: findUsers }
          : {
              get: getUserDoc,
              insert: insertUserDoc,
              find: findUserDocs,
              bulk: bulkUserDocs,
            },
      ),
      db: { list: vi.fn().mockResolvedValue([USER_DB_NAME]) },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: CouchService,
          useValue: {
            createAdminNanoInstance: vi.fn().mockResolvedValue(adminNano),
          },
        },
        { provide: CoversService, useValue: {} },
        {
          provide: getRepositoryToken(RefreshTokenPostgresEntity),
          useValue: {},
        },
      ],
    }).compile()

    service = module.get(MigrationService)
  })

  it("adds https:// to WebDAV and Synology Drive URLs without a scheme, once", async () => {
    getUserDoc.mockResolvedValue(SETTINGS)

    const firstRun = await service.migrateConnectorUrlSchemes()

    getUserDoc.mockResolvedValue({
      ...insertUserDoc.mock.calls[0]?.[0],
      _rev: "2-b",
    })

    const secondRun = await service.migrateConnectorUrlSchemes()

    expect(firstRun).toEqual({ usersMigrated: 1, connectorsUpdated: 2 })
    expect(secondRun).toEqual({ usersMigrated: 0, connectorsUpdated: 0 })
    expect(insertUserDoc.mock.calls).toEqual([
      [{ ...SETTINGS, connectors: MIGRATED_CONNECTORS }],
    ])
  })

  it("skips a user without a settings document", async () => {
    getUserDoc.mockRejectedValue(couchError(404))

    const result = await service.migrateConnectorUrlSchemes()

    expect(result).toEqual({ usersMigrated: 0, connectorsUpdated: 0 })
    expect(insertUserDoc).not.toHaveBeenCalled()
  })

  it("reads the settings again when a device changes them during the run", async () => {
    const settingsChangedByDevice = { ...SETTINGS, _rev: "2-b" }
    getUserDoc
      .mockResolvedValueOnce(SETTINGS)
      .mockResolvedValueOnce(settingsChangedByDevice)
    insertUserDoc
      .mockRejectedValueOnce(couchError(409))
      .mockResolvedValueOnce({ ok: true })

    const result = await service.migrateConnectorUrlSchemes()

    expect(result).toEqual({ usersMigrated: 1, connectorsUpdated: 2 })
    expect(insertUserDoc.mock.lastCall).toEqual([
      { ...settingsChangedByDevice, connectors: MIGRATED_CONNECTORS },
    ])
  })

  it("adds https:// to the connector URLs at startup", async () => {
    getUserDoc.mockResolvedValue(SETTINGS)

    service.onApplicationBootstrap()

    await expect
      .poll(() => insertUserDoc.mock.calls)
      .toEqual([[{ ...SETTINGS, connectors: MIGRATED_CONNECTORS }]])
  })

  it("does not let a failing startup run crash the API", async () => {
    findUsers.mockRejectedValue(new Error("couch is down"))

    expect(() => service.onApplicationBootstrap()).not.toThrow()
    await new Promise(process.nextTick)
  })

  it("moves the legacy WebDAV connectors that have an id into connectors", async () => {
    const legacyConnector = {
      id: "legacy",
      url: "https://nas.local/dav",
      username: "reader",
      passwordAsSecretId: "nas-secret",
    }
    getUserDoc.mockResolvedValue({
      _id: "settings",
      _rev: "1-a",
      connectors: [],
      webdavConnectors: [
        legacyConnector,
        { ...legacyConnector, id: undefined, url: "https://other.local/dav" },
      ],
    })

    const result = await service.migrateWebdavConnectorsToConnectors()

    expect(result).toEqual({ usersMigrated: 1, connectorsCreated: 1 })
    expect(insertUserDoc.mock.calls).toEqual([
      [
        {
          _id: "settings",
          _rev: "1-a",
          connectors: [{ ...legacyConnector, type: "webdav" }],
        },
      ],
    ])
  })

  it("rewrites the legacy WebDAV resource ids of links and collections", async () => {
    const legacyLink = {
      _id: "link-1",
      rx_model: "link",
      type: "webdav",
      resourceId: "webdav://nas.local:%2Fbooks%2Fa.epub",
    }
    const canonicalLink = {
      _id: "link-2",
      rx_model: "link",
      type: "webdav",
      resourceId: "webdav://%2Fbooks%2Fb.epub",
    }
    const legacyCollection = {
      _id: "collection-1",
      rx_model: "obokucollection",
      linkType: "webdav",
      linkResourceId: "webdav://_:%2Fbooks",
    }
    findUserDocs.mockImplementation(async function findByModel({ selector }) {
      return {
        docs:
          selector.rx_model === "link"
            ? [legacyLink, canonicalLink]
            : [legacyCollection],
      }
    })

    const result = await service.migrateWebdavResourceIds()

    expect(result).toEqual({
      usersMigrated: 1,
      linksUpdated: 1,
      collectionsUpdated: 1,
    })
    expect(bulkUserDocs.mock.calls).toEqual([
      [
        {
          docs: [
            { ...legacyLink, resourceId: "webdav://%2Fbooks%2Fa.epub" },
            { ...legacyCollection, linkResourceId: "webdav://%2Fbooks" },
          ],
        },
      ],
    ])
  })
})
