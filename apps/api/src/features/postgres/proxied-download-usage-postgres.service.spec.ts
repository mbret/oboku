import type { Mock } from "vitest"
import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import {
  ProxiedDownloadUsagePostgresEntity,
  UserProxiedDownloadUsagePostgresEntity,
} from "./entities.js"
import { ProxiedDownloadUsagePostgresService } from "./proxied-download-usage-postgres.service.js"

const MONTH = "2026-11-01"
const USER_ID = 7

const createInsertQueryBuilder = () => {
  const queryBuilder = {
    insert: vi.fn(),
    into: vi.fn(),
    values: vi.fn(),
    orIgnore: vi.fn(),
    execute: vi.fn().mockResolvedValue({ raw: [] }),
  }

  queryBuilder.insert.mockReturnValue(queryBuilder)
  queryBuilder.into.mockReturnValue(queryBuilder)
  queryBuilder.values.mockReturnValue(queryBuilder)
  queryBuilder.orIgnore.mockReturnValue(queryBuilder)

  return queryBuilder
}

describe("ProxiedDownloadUsagePostgresService", () => {
  let service: ProxiedDownloadUsagePostgresService
  let transactionManager: {
    createQueryBuilder: Mock
    findOneOrFail: Mock
    increment: Mock
  }
  let userUsageRepository: { findOneBy: Mock; delete: Mock }
  let usageRepository: {
    findOneBy: Mock
    manager: { transaction: Mock }
  }

  /** Locks counters holding `usedBytes` for the instance and `userUsedBytes` for the user. */
  const lockingCounters = ({
    usedBytes,
    userUsedBytes,
  }: {
    usedBytes: number
    userUsedBytes: number
  }) => {
    transactionManager.findOneOrFail.mockImplementation(
      async (entity: unknown) =>
        entity === ProxiedDownloadUsagePostgresEntity
          ? { month: MONTH, bytes: usedBytes }
          : { user_id: USER_ID, month: MONTH, bytes: userUsedBytes },
    )
  }

  const reserve = (bytes: number) =>
    service.reserveWithinQuotas({
      userId: USER_ID,
      month: MONTH,
      bytes,
      quotaBytes: 1000,
      userQuotaBytes: 100,
    })

  beforeEach(async () => {
    transactionManager = {
      createQueryBuilder: vi.fn(createInsertQueryBuilder),
      findOneOrFail: vi.fn(),
      increment: vi.fn(),
    }
    userUsageRepository = {
      findOneBy: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    }
    usageRepository = {
      findOneBy: vi.fn().mockResolvedValue(null),
      manager: {
        transaction: vi.fn((runInTransaction: (manager: unknown) => unknown) =>
          runInTransaction(transactionManager),
        ),
      },
    }

    const module = await Test.createTestingModule({
      providers: [
        ProxiedDownloadUsagePostgresService,
        {
          provide: getRepositoryToken(ProxiedDownloadUsagePostgresEntity),
          useValue: usageRepository,
        },
        {
          provide: getRepositoryToken(UserProxiedDownloadUsagePostgresEntity),
          useValue: userUsageRepository,
        },
      ],
    }).compile()

    service = module.get(ProxiedDownloadUsagePostgresService)
  })

  it("adds the bytes to both counters while both stay within their quotas", async () => {
    lockingCounters({ usedBytes: 500, userUsedBytes: 60 })

    expect(await reserve(40)).toBe("reserved")
    expect(transactionManager.increment.mock.calls).toEqual([
      [ProxiedDownloadUsagePostgresEntity, { month: MONTH }, "bytes", 40],
      [
        UserProxiedDownloadUsagePostgresEntity,
        { user_id: USER_ID, month: MONTH },
        "bytes",
        40,
      ],
    ])
  })

  it.each([
    ["the instance's", { usedBytes: 990, userUsedBytes: 0 }, 20],
    ["the user's", { usedBytes: 0, userUsedBytes: 90 }, 20],
    [
      "the user's, for a file of unknown size",
      { usedBytes: 0, userUsedBytes: 100 },
      0,
    ],
  ])(
    "adds nothing when %s quota would be passed",
    async (_, counters, bytes) => {
      lockingCounters(counters)

      expect(await reserve(bytes)).toBe("quota-reached")
      expect(transactionManager.increment).not.toHaveBeenCalled()
    },
  )

  it("locks the instance's counter before the user's", async () => {
    lockingCounters({ usedBytes: 0, userUsedBytes: 0 })

    await reserve(10)

    expect(transactionManager.findOneOrFail.mock.calls).toEqual([
      [
        ProxiedDownloadUsagePostgresEntity,
        { where: { month: MONTH }, lock: { mode: "pessimistic_write" } },
      ],
      [
        UserProxiedDownloadUsagePostgresEntity,
        {
          where: { user_id: USER_ID, month: MONTH },
          lock: { mode: "pessimistic_write" },
        },
      ],
    ])
  })

  it("finds no bytes for a month without counters", async () => {
    expect(await service.findBytes(MONTH)).toBe(0)
    expect(await service.findUserBytes({ userId: USER_ID, month: MONTH })).toBe(
      0,
    )
  })

  it("adds a signed amount to both counters", async () => {
    await service.adjust({ userId: USER_ID, month: MONTH, bytes: -120 })

    expect(transactionManager.increment.mock.calls).toEqual([
      [ProxiedDownloadUsagePostgresEntity, { month: MONTH }, "bytes", -120],
      [
        UserProxiedDownloadUsagePostgresEntity,
        { user_id: USER_ID, month: MONTH },
        "bytes",
        -120,
      ],
    ])
  })

  it("deletes a user's counters only", async () => {
    await service.deleteByUserId(USER_ID)

    expect(userUsageRepository.delete).toHaveBeenCalledWith({
      user_id: USER_ID,
    })
  })
})
