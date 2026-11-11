import { Test } from "@nestjs/testing"
import { SecretsService } from "../config/SecretsService.js"
import { AtRestCipher } from "../crypto/at-rest-cipher.js"
import type { ProviderConnectionPostgresEntity } from "../features/postgres/entities.js"
import { ProviderConnectionPostgresService } from "../features/postgres/provider-connection-postgres.service.js"
import { ProviderConnectionsService } from "./provider-connections.service.js"

const READER_ID = 1
const OTHER_READER_ID = 2
const REFRESH_TOKEN = "1//refresh-token"

const GOOGLE_CONNECTION: {
  provider: "google"
  credentials: { refreshToken: string }
  accountId: string
  accountName: string
  scopes: string[]
} = {
  provider: "google",
  credentials: { refreshToken: REFRESH_TOKEN },
  accountId: "google-sub",
  accountName: "reader@gmail.com",
  scopes: ["https://www.googleapis.com/auth/drive.file"],
}

/** Keeps rows in memory, keyed like the table's unique index. */
const createConnectionStore = () => {
  const rows = new Map<string, ProviderConnectionPostgresEntity>()
  const toKey = ({ userId, provider }: { userId: number; provider: string }) =>
    `${userId}:${provider}`

  const store: Pick<
    ProviderConnectionPostgresService,
    "find" | "save" | "delete"
  > = {
    find: async (key) => rows.get(toKey(key)) ?? null,
    save: async (connection) => {
      const connectedAt = new Date()

      rows.set(toKey(connection), {
        id: rows.size + 1,
        user_id: connection.userId,
        provider: connection.provider,
        encrypted_credentials: connection.encryptedCredentials,
        account_id: connection.accountId,
        account_name: connection.accountName,
        scopes: connection.scopes,
        connected_at: connectedAt,
        updated_at: connectedAt,
      })
    },
    delete: async (key) => {
      rows.delete(toKey(key))
    },
  }

  return { rows, store }
}

const createService = async () => {
  const { rows, store } = createConnectionStore()
  const module = await Test.createTestingModule({
    providers: [
      ProviderConnectionsService,
      AtRestCipher,
      { provide: ProviderConnectionPostgresService, useValue: store },
      {
        provide: SecretsService,
        useValue: { getJwtPrivateKey: async () => "jwt-private-key" },
      },
    ],
  }).compile()

  return { rows, service: module.get(ProviderConnectionsService) }
}

describe("ProviderConnectionsService", () => {
  it("gives back the credentials it kept, encrypted", async () => {
    const { rows, service } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })

    await expect(
      service.getCredentials({ userId: READER_ID, provider: "google" }),
    ).resolves.toEqual({ refreshToken: REFRESH_TOKEN })
    expect(JSON.stringify([...rows.values()]).includes(REFRESH_TOKEN)).toBe(
      false,
    )
  })

  it("finds the connection without its credentials", async () => {
    const { service } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })

    const connection = await service.find({
      userId: READER_ID,
      provider: "google",
    })

    expect(connection).toMatchObject({
      accountId: "google-sub",
      accountName: "reader@gmail.com",
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })
    expect(JSON.stringify(connection)).not.toContain("credentials")
  })

  it("refuses credentials copied into another user's connection", async () => {
    const { rows, service } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.connect({
      userId: OTHER_READER_ID,
      ...GOOGLE_CONNECTION,
      credentials: { refreshToken: "other-refresh-token" },
    })

    const readerRow = rows.get(`${READER_ID}:google`)
    const otherRow = rows.get(`${OTHER_READER_ID}:google`)

    if (!readerRow || !otherRow)
      throw new Error("The connections were not saved")

    otherRow.encrypted_credentials = readerRow.encrypted_credentials

    await expect(
      service.getCredentials({ userId: OTHER_READER_ID, provider: "google" }),
    ).resolves.toBeNull()
  })

  it("has nothing for a user who never connected, or disconnected", async () => {
    const { service } = await createService()

    await expect(
      service.getCredentials({ userId: READER_ID, provider: "google" }),
    ).resolves.toBeNull()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.disconnect({ userId: READER_ID, provider: "google" })

    await expect(
      service.find({ userId: READER_ID, provider: "google" }),
    ).resolves.toBeNull()
  })
})
