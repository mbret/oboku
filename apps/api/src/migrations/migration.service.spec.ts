import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { CouchService } from "src/couch/couch.service"
import { CoversService } from "src/covers/covers.service"
import { RefreshTokenPostgresEntity } from "src/features/postgres/entities"
import { USER_DB_INDEXES } from "src/lib/couch/userDbIndexes"
import { MigrationService } from "./migration.service"

const emailToDbName = (email: string) =>
  `userdb-${Buffer.from(email).toString("hex")}`

describe("MigrationService.ensureUserDbIndexes", () => {
  let service: MigrationService
  let createIndex: jest.Mock
  let listDatabases: jest.Mock
  let findUsers: jest.Mock

  beforeEach(async () => {
    createIndex = jest.fn()
    listDatabases = jest.fn()
    findUsers = jest.fn()

    const adminNano = {
      use: jest.fn((dbName: string) =>
        dbName === "_users" ? { find: findUsers } : { createIndex },
      ),
      db: { list: listDatabases },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: CouchService,
          useValue: {
            createAdminNanoInstance: jest.fn().mockResolvedValue(adminNano),
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

  it("creates the indexes on every user database that exists", async () => {
    findUsers.mockResolvedValue({
      docs: [{ name: "a@example.com" }, { name: "b@example.com" }],
    })
    listDatabases.mockResolvedValue([
      emailToDbName("a@example.com"),
      emailToDbName("b@example.com"),
    ])
    createIndex.mockImplementation(async ({ name }) => ({
      result: name === "rx_model" ? "exists" : "created",
      id: `_design/idx-${name}`,
      name,
    }))

    const result = await service.ensureUserDbIndexes()

    expect(createIndex).toHaveBeenCalledTimes(USER_DB_INDEXES.length * 2)
    expect(result).toEqual({
      ranOnUsers: 2,
      indexesCreated: (USER_DB_INDEXES.length - 1) * 2,
      indexesExisting: 2,
    })
  })

  it("skips a user whose database vanished after discovery", async () => {
    findUsers.mockResolvedValue({
      docs: [{ name: "a@example.com" }, { name: "gone@example.com" }],
    })
    listDatabases.mockResolvedValue([
      emailToDbName("a@example.com"),
      emailToDbName("gone@example.com"),
    ])
    const missingDb = Object.assign(new Error("not found"), {
      statusCode: 404,
      reason: "Database does not exist.",
    })
    createIndex.mockImplementation(async ({ ddoc }) => {
      if (createIndex.mock.calls.length > USER_DB_INDEXES.length) {
        throw missingDb
      }

      return { result: "created", id: `_design/${ddoc}`, name: ddoc }
    })

    const result = await service.ensureUserDbIndexes()

    expect(result).toEqual({
      ranOnUsers: 1,
      indexesCreated: USER_DB_INDEXES.length,
      indexesExisting: 0,
    })
  })
})
