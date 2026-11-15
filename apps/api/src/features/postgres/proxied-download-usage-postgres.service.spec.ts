import type { Mock } from "vitest"
import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { ProxiedDownloadUsagePostgresEntity } from "./entities.js"
import { ProxiedDownloadUsagePostgresService } from "./proxied-download-usage-postgres.service.js"

const MONTH = "2026-11-01"

/** Answers the insert of the month's row, then the reservation's update, which matches `updatedRows` rows. */
const createQueryBuilder = (updatedRows: number) => {
  const queryBuilder = {
    insert: vi.fn(),
    values: vi.fn(),
    orIgnore: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
    andWhere: vi.fn(),
    setParameters: vi.fn(),
    execute: vi.fn(),
  }

  for (const method of [
    queryBuilder.insert,
    queryBuilder.values,
    queryBuilder.orIgnore,
    queryBuilder.update,
    queryBuilder.set,
    queryBuilder.where,
    queryBuilder.andWhere,
    queryBuilder.setParameters,
  ]) {
    method.mockReturnValue(queryBuilder)
  }

  queryBuilder.execute
    .mockResolvedValueOnce({ raw: [] })
    .mockResolvedValueOnce({ affected: updatedRows })

  return queryBuilder
}

describe("ProxiedDownloadUsagePostgresService", () => {
  let service: ProxiedDownloadUsagePostgresService
  let repository: {
    createQueryBuilder: Mock
    increment: Mock
    findOneBy: Mock
  }

  const reserve = () =>
    service.reserveWithinQuota({ month: MONTH, bytes: 300, quotaBytes: 1000 })

  beforeEach(async () => {
    repository = {
      createQueryBuilder: vi.fn(),
      increment: vi.fn(),
      findOneBy: vi.fn().mockResolvedValue(null),
    }

    const module = await Test.createTestingModule({
      providers: [
        ProxiedDownloadUsagePostgresService,
        {
          provide: getRepositoryToken(ProxiedDownloadUsagePostgresEntity),
          useValue: repository,
        },
      ],
    }).compile()

    service = module.get(ProxiedDownloadUsagePostgresService)
  })

  it("reserves the bytes when the update matches the month's counter", async () => {
    repository.createQueryBuilder.mockReturnValue(createQueryBuilder(1))

    expect(await reserve()).toBe("reserved")
  })

  it("reports the quota reached when the counter would pass it", async () => {
    repository.createQueryBuilder.mockReturnValue(createQueryBuilder(0))

    expect(await reserve()).toBe("quota-reached")
  })

  it("finds no bytes for a month without a counter", async () => {
    expect(await service.findBytes(MONTH)).toBe(0)
    expect(repository.findOneBy).toHaveBeenCalledWith({ month: MONTH })
  })

  it("adds a signed amount to the month's counter", async () => {
    await service.adjust({ month: MONTH, bytes: -120 })

    expect(repository.increment).toHaveBeenCalledWith(
      { month: MONTH },
      "bytes",
      -120,
    )
  })
})
