import type { Mock } from "vitest"
import { Test, TestingModule } from "@nestjs/testing"
import { CouchService } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { NotificationPostgresService } from "../features/postgres/notification-postgres.service.js"
import { RefreshTokensService } from "../features/postgres/refreshTokens.service.js"
import { KoreaderSyncPostgresService } from "../features/postgres/koreader-sync-postgres.service.js"
import { KoreaderSyncConnectionPostgresService } from "../features/postgres/koreader-sync-connection-postgres.service.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { UsersService } from "./users.service.js"

vi.mock("../couch/dbHelpers.js", async function mockDbHelpers(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../couch/dbHelpers.js")>()),
    find: vi.fn(async () => []),
    deleteCouchUser: vi.fn(async () => {}),
  }
})

describe("UsersService", () => {
  let service: UsersService
  let userPostgresService: {
    findByEmail: Mock
    create: Mock
    save: Mock
    deleteById: Mock
  }
  let refreshTokensService: {
    deleteByUserId: Mock
  }
  let notificationPostgresService: { deleteDeliveriesByUserId: Mock }
  let syncReportPostgresService: { deleteByUserName: Mock }
  let koreaderSyncPostgresService: { deleteByUserId: Mock }
  let koreaderSyncConnectionPostgresService: { deleteByUserId: Mock }
  let opdsServerPostgresService: { deleteByUserId: Mock }

  beforeEach(async () => {
    userPostgresService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      deleteById: vi.fn(),
    }
    refreshTokensService = {
      deleteByUserId: vi.fn(),
    }
    notificationPostgresService = { deleteDeliveriesByUserId: vi.fn() }
    syncReportPostgresService = { deleteByUserName: vi.fn() }
    koreaderSyncPostgresService = { deleteByUserId: vi.fn() }
    koreaderSyncConnectionPostgresService = { deleteByUserId: vi.fn() }
    opdsServerPostgresService = { deleteByUserId: vi.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserPostgresService, useValue: userPostgresService },
        {
          provide: CouchService,
          useValue: { createAdminNanoInstance: async () => ({ use: vi.fn() }) },
        },
        { provide: CoversService, useValue: {} },
        {
          provide: NotificationPostgresService,
          useValue: notificationPostgresService,
        },
        {
          provide: SyncReportPostgresService,
          useValue: syncReportPostgresService,
        },
        { provide: RefreshTokensService, useValue: refreshTokensService },
        {
          provide: KoreaderSyncPostgresService,
          useValue: koreaderSyncPostgresService,
        },
        {
          provide: KoreaderSyncConnectionPostgresService,
          useValue: koreaderSyncConnectionPostgresService,
        },
        {
          provide: OpdsServerPostgresService,
          useValue: opdsServerPostgresService,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it("forwards findUserByEmail to UserPostgresService", async () => {
    userPostgresService.findByEmail.mockResolvedValue(null)

    await service.findUserByEmail(" Reader@Example.com ")

    expect(userPostgresService.findByEmail).toHaveBeenCalledWith(
      " Reader@Example.com ",
    )
  })

  it("forwards registerUser to UserPostgresService.create", async () => {
    const payload = {
      email: " Reader@Example.com ",
      username: "Reader",
      password: "hashed-password",
      emailVerified: false,
    }
    const created = { id: 1, ...payload, email: "reader@example.com" }
    userPostgresService.create.mockResolvedValue(created)

    const result = await service.registerUser(payload)

    expect(userPostgresService.create).toHaveBeenCalledWith(payload)
    expect(result).toBe(created)
  })

  it("forwards saveUser to UserPostgresService.save", async () => {
    const user = {
      id: 1,
      email: " Reader@Example.com ",
      username: "Reader",
      password: "hashed-password",
      emailVerified: true,
      createdAt: new Date(),
    }
    userPostgresService.save.mockResolvedValue(user)

    await service.saveUser(user)

    expect(userPostgresService.save).toHaveBeenCalledWith(user)
  })

  it("deletes the Postgres rows keyed by the account", async () => {
    await service.deleteAccount({ userId: 1, email: "reader@example.com" })

    expect(refreshTokensService.deleteByUserId).toHaveBeenCalledWith(1)
    expect(
      notificationPostgresService.deleteDeliveriesByUserId,
    ).toHaveBeenCalledWith(1)
    expect(syncReportPostgresService.deleteByUserName).toHaveBeenCalledWith(
      "reader@example.com",
    )
    expect(koreaderSyncPostgresService.deleteByUserId).toHaveBeenCalledWith(1)
    expect(
      koreaderSyncConnectionPostgresService.deleteByUserId,
    ).toHaveBeenCalledWith(1)
    expect(opdsServerPostgresService.deleteByUserId).toHaveBeenCalledWith(1)
    expect(userPostgresService.deleteById).toHaveBeenCalledWith(1)
  })
})
