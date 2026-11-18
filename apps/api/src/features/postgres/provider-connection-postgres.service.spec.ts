import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Not } from "typeorm"
import {
  ProviderConnectionPostgresEntity,
  UserPostgresEntity,
} from "./entities.js"
import { ProviderConnectionPostgresService } from "./provider-connection-postgres.service.js"

const createService = async () => {
  const transactionManager = {
    findOne: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  }
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    manager: {
      transaction: vi.fn(
        (runInTransaction: (manager: typeof transactionManager) => unknown) =>
          runInTransaction(transactionManager),
      ),
    },
  }
  const module = await Test.createTestingModule({
    providers: [
      ProviderConnectionPostgresService,
      {
        provide: getRepositoryToken(ProviderConnectionPostgresEntity),
        useValue: repository,
      },
    ],
  }).compile()

  return {
    repository,
    transactionManager,
    service: module.get(ProviderConnectionPostgresService),
  }
}

describe("ProviderConnectionPostgresService", () => {
  it("replaces the user's connection to the same account, with fresh dates", async () => {
    const { repository, service } = await createService()

    await service.save({
      userId: 1,
      provider: "google",
      encryptedCredentials: "1.payload",
      accountId: "google-sub",
      accountName: "reader@gmail.com",
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })

    expect(repository.upsert).toHaveBeenCalledWith(
      {
        user_id: 1,
        provider: "google",
        encrypted_credentials: "1.payload",
        account_id: "google-sub",
        account_name: "reader@gmail.com",
        scopes: ["https://www.googleapis.com/auth/drive.file"],
        connected_at: expect.any(Date),
        updated_at: expect.any(Date),
      },
      ["user_id", "provider", "account_id"],
    )
  })

  it("finds and deletes a connection by user, provider and account", async () => {
    const { repository, service } = await createService()
    const key = { userId: 1, provider: "google", accountId: "google-sub" }

    await service.find(key)
    await service.delete(key)

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { user_id: 1, provider: "google", account_id: "google-sub" },
    })
    expect(repository.delete).toHaveBeenCalledWith({
      user_id: 1,
      provider: "google",
      account_id: "google-sub",
    })
  })

  it("lists the user's connections to the provider, the latest first", async () => {
    const { repository, service } = await createService()

    await service.list({ userId: 1, provider: "webdav" })

    expect(repository.find).toHaveBeenCalledWith({
      where: { user_id: 1, provider: "webdav" },
      order: { connected_at: "DESC", id: "DESC" },
    })
  })

  it("saves the only account of a user's provider once the user's row is locked", async () => {
    const { transactionManager, service } = await createService()

    await service.saveAsOnlyAccount({
      userId: 1,
      provider: "google",
      encryptedCredentials: "1.payload",
      accountId: "work-sub",
      accountName: "reader@work.example",
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })

    expect(transactionManager.findOne).toHaveBeenCalledWith(
      UserPostgresEntity,
      { where: { id: 1 }, lock: { mode: "pessimistic_write" } },
    )
    expect(transactionManager.delete).toHaveBeenCalledWith(
      ProviderConnectionPostgresEntity,
      { user_id: 1, provider: "google", account_id: Not("work-sub") },
    )
    expect(transactionManager.upsert).toHaveBeenCalledWith(
      ProviderConnectionPostgresEntity,
      expect.objectContaining({
        user_id: 1,
        provider: "google",
        account_id: "work-sub",
      }),
      ["user_id", "provider", "account_id"],
    )

    const [lockOrder] = transactionManager.findOne.mock.invocationCallOrder
    const [deleteOrder] = transactionManager.delete.mock.invocationCallOrder
    const [upsertOrder] = transactionManager.upsert.mock.invocationCallOrder

    expect(lockOrder).toBeLessThan(deleteOrder ?? 0)
    expect(deleteOrder).toBeLessThan(upsertOrder ?? 0)
  })

  it.each([
    [1, true],
    [0, false],
  ])(
    "deletes by user, provider, account and update time, answering whether %i row matched",
    async (affected, isDeleted) => {
      const { repository, service } = await createService()
      const updatedAt = new Date("2026-11-18T10:00:00.000Z")
      repository.delete.mockResolvedValue({ affected })

      const answer = await service.deleteIfUnchanged({
        userId: 1,
        provider: "webdav",
        accountId: "nas",
        updatedAt,
      })

      expect(repository.delete).toHaveBeenCalledWith({
        user_id: 1,
        provider: "webdav",
        account_id: "nas",
        updated_at: updatedAt,
      })
      expect(answer).toBe(isDeleted)
    },
  )

  it("deletes every connection of a user", async () => {
    const { repository, service } = await createService()

    await service.deleteByUserId(1)

    expect(repository.delete).toHaveBeenCalledWith({ user_id: 1 })
  })
})
