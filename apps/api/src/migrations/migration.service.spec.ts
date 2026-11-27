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

describe("MigrationService.migrateConnectorUrlSchemes", () => {
  let service: MigrationService
  let findUsers: Mock
  let getUserDoc: Mock
  let insertUserDoc: Mock

  beforeEach(async () => {
    findUsers = vi.fn().mockResolvedValue({ docs: [{ name: USER_EMAIL }] })
    getUserDoc = vi.fn()
    insertUserDoc = vi.fn().mockResolvedValue({ ok: true })

    const adminNano = {
      use: vi.fn((dbName: string) =>
        dbName === "_users"
          ? { find: findUsers }
          : { get: getUserDoc, insert: insertUserDoc },
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
})
