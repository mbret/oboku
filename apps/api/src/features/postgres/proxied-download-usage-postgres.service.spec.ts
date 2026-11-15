import type { Mock } from "vitest"
import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { UserProxiedDownloadUsagePostgresEntity } from "./entities.js"
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
    query: Mock
    createQueryBuilder: Mock
    findOneByOrFail: Mock
    increment: Mock
  }
  let userUsageRepository: {
    findOneBy: Mock
    increment: Mock
    manager: { transaction: Mock; query: Mock }
  }

  /** The month's counters sum to `usedBytes`, the user's holds `userUsedBytes`. */
  const holdingUsage = ({
    usedBytes,
    userUsedBytes,
  }: {
    usedBytes: number
    userUsedBytes: number
  }) => {
    transactionManager.query.mockImplementation(async (sql: string) =>
      sql.includes("SUM") ? [{ bytes: String(usedBytes) }] : [],
    )
    transactionManager.findOneByOrFail.mockResolvedValue({
      user_id: USER_ID,
      month: MONTH,
      bytes: userUsedBytes,
    })
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
      query: vi.fn(),
      createQueryBuilder: vi.fn(createInsertQueryBuilder),
      findOneByOrFail: vi.fn(),
      increment: vi.fn(),
    }
    userUsageRepository = {
      findOneBy: vi.fn().mockResolvedValue(null),
      increment: vi.fn(),
      manager: {
        transaction: vi.fn((runInTransaction: (manager: unknown) => unknown) =>
          runInTransaction(transactionManager),
        ),
        query: vi.fn().mockResolvedValue([{ bytes: "0" }]),
      },
    }

    const module = await Test.createTestingModule({
      providers: [
        ProxiedDownloadUsagePostgresService,
        {
          provide: getRepositoryToken(UserProxiedDownloadUsagePostgresEntity),
          useValue: userUsageRepository,
        },
      ],
    }).compile()

    service = module.get(ProxiedDownloadUsagePostgresService)
  })

  it("adds the bytes to the user's counter while both usages stay within their quotas", async () => {
    holdingUsage({ usedBytes: 500, userUsedBytes: 60 })

    expect(await reserve(40)).toBe("reserved")
    expect(transactionManager.increment).toHaveBeenCalledWith(
      UserProxiedDownloadUsagePostgresEntity,
      { user_id: USER_ID, month: MONTH },
      "bytes",
      40,
    )
  })

  it.each([
    ["the instance's", { usedBytes: 990, userUsedBytes: 0 }, 20],
    ["the user's", { usedBytes: 0, userUsedBytes: 90 }, 20],
    [
      "the user's, for a file of unknown size",
      { usedBytes: 0, userUsedBytes: 100 },
      0,
    ],
  ])("adds nothing when %s quota would be passed", async (_, usage, bytes) => {
    holdingUsage(usage)

    expect(await reserve(bytes)).toBe("quota-reached")
    expect(transactionManager.increment).not.toHaveBeenCalled()
  })

  it("locks the month before it reads the month's sum", async () => {
    holdingUsage({ usedBytes: 0, userUsedBytes: 0 })

    await reserve(10)

    const [lockCall, sumCall] = transactionManager.query.mock.calls

    expect(lockCall).toEqual([
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`proxied_download_usage:${MONTH}`],
    ])
    expect(sumCall?.[1]).toEqual([MONTH])
  })

  it("finds no bytes for a month without counters", async () => {
    expect(await service.findBytes(MONTH)).toBe(0)
    expect(await service.findUserBytes({ userId: USER_ID, month: MONTH })).toBe(
      0,
    )
  })

  it("adds a signed amount to the user's counter", async () => {
    await service.adjust({ userId: USER_ID, month: MONTH, bytes: -120 })

    expect(userUsageRepository.increment).toHaveBeenCalledWith(
      { user_id: USER_ID, month: MONTH },
      "bytes",
      -120,
    )
  })
})
