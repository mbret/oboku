import type { Mock } from "vitest"
import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { InstanceStreamingUsagePostgresEntity } from "./entities.js"
import { StreamingUsagePostgresService } from "./streaming-usage-postgres.service.js"

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

describe("StreamingUsagePostgresService", () => {
  let service: StreamingUsagePostgresService
  let repository: { createQueryBuilder: Mock; increment: Mock }

  const reserve = () =>
    service.reserveUnderCap({ month: MONTH, bytes: 300, capBytes: 1000 })

  beforeEach(async () => {
    repository = { createQueryBuilder: vi.fn(), increment: vi.fn() }

    const module = await Test.createTestingModule({
      providers: [
        StreamingUsagePostgresService,
        {
          provide: getRepositoryToken(InstanceStreamingUsagePostgresEntity),
          useValue: repository,
        },
      ],
    }).compile()

    service = module.get(StreamingUsagePostgresService)
  })

  it("reserves the bytes when the update matches the month's counter", async () => {
    repository.createQueryBuilder.mockReturnValue(createQueryBuilder(1))

    expect(await reserve()).toBe("reserved")
  })

  it("reports the cap reached when the counter would pass it", async () => {
    repository.createQueryBuilder.mockReturnValue(createQueryBuilder(0))

    expect(await reserve()).toBe("cap-reached")
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
