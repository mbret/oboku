import type { Mock } from "vitest"
import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { OpdsServerPostgresEntity, UserPostgresEntity } from "./entities.js"
import { OpdsServerPostgresService } from "./opds-server-postgres.service.js"

const SERVER: OpdsServerPostgresEntity = {
  id: 7,
  user_id: 1,
  slug: "calm-snails-dream",
  name: "Calm snails dream",
  password_hash: "a".repeat(64),
  created_at: new Date("2026-10-28T00:00:00.000Z"),
}

const TAKEN_CANDIDATE = { slug: "brave-foxes-run", name: "Brave foxes run" }
const FREE_CANDIDATE = { slug: SERVER.slug, name: SERVER.name }

/** Answers each insert with the next of `insertedRows`: a row, or none when the slug was taken. */
const createInsertQueryBuilder = (
  insertedRows: (OpdsServerPostgresEntity | undefined)[],
) => {
  const queryBuilder = {
    insert: vi.fn(),
    into: vi.fn(),
    values: vi.fn(),
    orIgnore: vi.fn(),
    returning: vi.fn(),
    execute: vi.fn(),
  }

  queryBuilder.insert.mockReturnValue(queryBuilder)
  queryBuilder.into.mockReturnValue(queryBuilder)
  queryBuilder.values.mockReturnValue(queryBuilder)
  queryBuilder.orIgnore.mockReturnValue(queryBuilder)
  queryBuilder.returning.mockReturnValue(queryBuilder)

  for (const row of insertedRows) {
    queryBuilder.execute.mockResolvedValueOnce({ raw: row ? [row] : [] })
  }

  return queryBuilder
}

describe("OpdsServerPostgresService", () => {
  let service: OpdsServerPostgresService
  let transactionManager: {
    findOne: Mock
    count: Mock
    createQueryBuilder: Mock
  }
  let repository: {
    find: Mock
    findOneBy: Mock
    update: Mock
    delete: Mock
    manager: { transaction: Mock }
  }

  const insertUnderLimit = (maxServers: number) =>
    service.insertUnderLimit({
      userId: 1,
      maxServers,
      passwordHash: SERVER.password_hash,
      candidates: [TAKEN_CANDIDATE, FREE_CANDIDATE],
    })

  beforeEach(async () => {
    transactionManager = {
      findOne: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      createQueryBuilder: vi.fn(),
    }
    repository = {
      find: vi.fn().mockResolvedValue([SERVER]),
      findOneBy: vi.fn().mockResolvedValue(SERVER),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      manager: {
        transaction: vi.fn((runInTransaction: (manager: unknown) => unknown) =>
          runInTransaction(transactionManager),
        ),
      },
    }

    const module = await Test.createTestingModule({
      providers: [
        OpdsServerPostgresService,
        {
          provide: getRepositoryToken(OpdsServerPostgresEntity),
          useValue: repository,
        },
      ],
    }).compile()

    service = module.get(OpdsServerPostgresService)
  })

  it("lists only the user's servers, oldest first", async () => {
    await service.findByUserId(1)

    expect(repository.find).toHaveBeenCalledWith({
      where: { user_id: 1 },
      order: { id: "ASC" },
    })
  })

  it("locks the user's row before counting the user's servers", async () => {
    transactionManager.createQueryBuilder.mockReturnValue(
      createInsertQueryBuilder([undefined, SERVER]),
    )

    await insertUnderLimit(3)

    expect(transactionManager.findOne).toHaveBeenCalledWith(
      UserPostgresEntity,
      { where: { id: 1 }, lock: { mode: "pessimistic_write" } },
    )
    expect(transactionManager.count).toHaveBeenCalledWith(
      OpdsServerPostgresEntity,
      { where: { user_id: 1 } },
    )
    expect(transactionManager.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      transactionManager.count.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it("inserts nothing once the user has as many servers as allowed", async () => {
    transactionManager.count.mockResolvedValue(3)

    expect(await insertUnderLimit(3)).toEqual({ status: "limit-reached" })
    expect(transactionManager.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("inserts under the first candidate slug no other server has", async () => {
    const queryBuilder = createInsertQueryBuilder([undefined, SERVER])
    transactionManager.createQueryBuilder.mockReturnValue(queryBuilder)

    expect(await insertUnderLimit(3)).toEqual({
      status: "created",
      server: SERVER,
    })
    expect(queryBuilder.orIgnore).toHaveBeenCalled()
    expect(queryBuilder.values).toHaveBeenLastCalledWith({
      user_id: 1,
      slug: FREE_CANDIDATE.slug,
      name: FREE_CANDIDATE.name,
      password_hash: SERVER.password_hash,
      created_at: expect.any(Date),
    })
  })

  it("reports when every candidate slug is taken", async () => {
    transactionManager.createQueryBuilder.mockReturnValue(
      createInsertQueryBuilder([undefined, undefined]),
    )

    expect(await insertUnderLimit(3)).toEqual({ status: "slugs-taken" })
  })

  it("renames only a server the user owns", async () => {
    const server = await service.rename({ userId: 1, id: 7, name: "Kids" })

    expect(server).toBe(SERVER)
    expect(repository.update).toHaveBeenCalledWith(
      { id: 7, user_id: 1 },
      { name: "Kids" },
    )
  })

  it("replaces the password hash only on a server the user owns", async () => {
    await service.replacePasswordHash({
      userId: 1,
      id: 7,
      passwordHash: "b".repeat(64),
    })

    expect(repository.update).toHaveBeenCalledWith(
      { id: 7, user_id: 1 },
      { password_hash: "b".repeat(64) },
    )
  })

  it("returns no server when the user owns none with that id", async () => {
    repository.update.mockResolvedValue({ affected: 0 })

    const server = await service.rename({ userId: 2, id: 7, name: "Mine" })

    expect(server).toBeNull()
    expect(repository.findOneBy).not.toHaveBeenCalled()
  })

  it("deletes only a server the user owns", async () => {
    expect(await service.delete({ userId: 1, id: 7 })).toBe(true)
    expect(repository.delete).toHaveBeenCalledWith({ id: 7, user_id: 1 })
  })

  it("reports a delete that matched none of the user's servers", async () => {
    repository.delete.mockResolvedValue({ affected: 0 })

    expect(await service.delete({ userId: 2, id: 7 })).toBe(false)
  })

  it("deletes every server of an account", async () => {
    await service.deleteByUserId(1)

    expect(repository.delete).toHaveBeenCalledWith({ user_id: 1 })
  })
})
