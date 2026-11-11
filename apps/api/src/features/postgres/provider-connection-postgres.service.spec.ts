import { Test } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { ProviderConnectionPostgresEntity } from "./entities.js"
import { ProviderConnectionPostgresService } from "./provider-connection-postgres.service.js"

const createService = async () => {
  const repository = {
    findOne: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
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

  return { repository, service: module.get(ProviderConnectionPostgresService) }
}

describe("ProviderConnectionPostgresService", () => {
  it("replaces the user's connection to the provider, with fresh dates", async () => {
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
      ["user_id", "provider"],
    )
  })

  it("finds and deletes a connection by user and provider", async () => {
    const { repository, service } = await createService()

    await service.find({ userId: 1, provider: "google" })
    await service.delete({ userId: 1, provider: "google" })

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { user_id: 1, provider: "google" },
    })
    expect(repository.delete).toHaveBeenCalledWith({
      user_id: 1,
      provider: "google",
    })
  })

  it("deletes every connection of a user", async () => {
    const { repository, service } = await createService()

    await service.deleteByUserId(1)

    expect(repository.delete).toHaveBeenCalledWith({ user_id: 1 })
  })
})
