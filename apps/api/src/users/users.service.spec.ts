import type { Mock } from "vitest"
import { Test, TestingModule } from "@nestjs/testing"
import { CouchService } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { NotificationPostgresService } from "../features/postgres/notification-postgres.service.js"
import { RefreshTokensService } from "../features/postgres/refreshTokens.service.js"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { UsersService } from "./users.service.js"

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserPostgresService, useValue: userPostgresService },
        { provide: CouchService, useValue: {} },
        { provide: CoversService, useValue: {} },
        { provide: NotificationPostgresService, useValue: {} },
        { provide: SyncReportPostgresService, useValue: {} },
        { provide: RefreshTokensService, useValue: refreshTokensService },
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
})
