import type { Mock } from "vitest"
import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { OpdsServerPostgresEntity } from "./entities.js"
import { OpdsServerPostgresService } from "./opds-server-postgres.service.js"

const SERVER: OpdsServerPostgresEntity = {
  id: 7,
  user_id: 1,
  slug: "calm-snails-dream",
  name: "Calm snails dream",
  password_hash: "a".repeat(64),
  created_at: new Date("2026-10-28T00:00:00.000Z"),
}

const createInsertQueryBuilder = (raw: OpdsServerPostgresEntity[]) => {
  const queryBuilder = {
    insert: vi.fn(),
    values: vi.fn(),
    orIgnore: vi.fn(),
    returning: vi.fn(),
    execute: vi.fn().mockResolvedValue({ raw }),
  }

  queryBuilder.insert.mockReturnValue(queryBuilder)
  queryBuilder.values.mockReturnValue(queryBuilder)
  queryBuilder.orIgnore.mockReturnValue(queryBuilder)
  queryBuilder.returning.mockReturnValue(queryBuilder)

  return queryBuilder
}

describe("OpdsServerPostgresService", () => {
  let service: OpdsServerPostgresService
  let repository: {
    find: Mock
    count: Mock
    findOneBy: Mock
    update: Mock
    delete: Mock
    createQueryBuilder: Mock
  }

  beforeEach(async () => {
    repository = {
      find: vi.fn().mockResolvedValue([SERVER]),
      count: vi.fn().mockResolvedValue(1),
      findOneBy: vi.fn().mockResolvedValue(SERVER),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: vi.fn(),
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

  it("counts only the user's servers", async () => {
    expect(await service.countByUserId(1)).toBe(1)
    expect(repository.count).toHaveBeenCalledWith({ where: { user_id: 1 } })
  })

  it("returns the inserted server", async () => {
    const queryBuilder = createInsertQueryBuilder([SERVER])
    repository.createQueryBuilder.mockReturnValue(queryBuilder)

    const server = await service.insertUnlessSlugTaken({
      userId: 1,
      slug: SERVER.slug,
      name: SERVER.name,
      passwordHash: SERVER.password_hash,
    })

    expect(server).toBe(SERVER)
    expect(queryBuilder.values).toHaveBeenCalledWith({
      user_id: 1,
      slug: SERVER.slug,
      name: SERVER.name,
      password_hash: SERVER.password_hash,
      created_at: expect.any(Date),
    })
  })

  it("returns no server when the insert skips a taken slug", async () => {
    const queryBuilder = createInsertQueryBuilder([])
    repository.createQueryBuilder.mockReturnValue(queryBuilder)

    const server = await service.insertUnlessSlugTaken({
      userId: 1,
      slug: SERVER.slug,
      name: SERVER.name,
      passwordHash: SERVER.password_hash,
    })

    expect(server).toBeNull()
    expect(queryBuilder.orIgnore).toHaveBeenCalled()
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
