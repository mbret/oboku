import { Test, type TestingModule } from "@nestjs/testing"
import { USER_DB_INDEXES } from "src/lib/couch/userDbIndexes"
import { CouchService } from "./couch.service"
import { UserDbIndexesService } from "./user-db-indexes.service"

const emailToDbName = (email: string) =>
  `userdb-${Buffer.from(email).toString("hex")}`

describe("UserDbIndexesService", () => {
  let service: UserDbIndexesService
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
        UserDbIndexesService,
        {
          provide: CouchService,
          useValue: {
            createAdminNanoInstance: jest.fn().mockResolvedValue(adminNano),
          },
        },
      ],
    }).compile()

    service = module.get(UserDbIndexesService)
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

    const result = await service.ensureOnAllUserDatabases()

    expect(createIndex).toHaveBeenCalledTimes(USER_DB_INDEXES.length * 2)
    expect(result).toEqual({
      ranOnUsers: 2,
      indexesCreated: (USER_DB_INDEXES.length - 1) * 2,
      indexesExisting: 2,
    })
  })

  it("does not let a failing startup pass crash the application", async () => {
    findUsers.mockRejectedValue(new Error("couch is down"))

    expect(() => service.onApplicationBootstrap()).not.toThrow()
    await new Promise(process.nextTick)
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

    const result = await service.ensureOnAllUserDatabases()

    expect(result).toEqual({
      ranOnUsers: 1,
      indexesCreated: USER_DB_INDEXES.length,
      indexesExisting: 0,
    })
  })
})
