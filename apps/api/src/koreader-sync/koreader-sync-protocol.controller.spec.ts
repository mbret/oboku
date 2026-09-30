import type { INestApplication } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types"
import { AuthGuard } from "../auth/auth.guard"
import { SecretsService } from "../config/SecretsService"
import type {
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities"
import {
  type KoreaderSyncProgress,
  KoreaderSyncPostgresService,
} from "../features/postgres/koreader-sync-postgres.service"
import {
  normalizeEmail,
  UserPostgresService,
} from "../features/postgres/user-postgres.service"
import { toSyncKey } from "./credentials"
import { KoreaderSyncAuthGuard } from "./koreader-sync-auth.guard"
import { KoreaderSyncProtocolController } from "./koreader-sync-protocol.controller"
import { KoreaderSyncService } from "./koreader-sync.service"

const READER = { id: 1, email: "reader@example.com" }
const OTHER_READER = { id: 2, email: "other@example.com" }
const DOCUMENT = "0b229176d4e8db7f6d2b5a4952368d7a"
const XPOINTER = "/body/DocFragment[14]/body/div/p[3]/text().42"
const UNAUTHORIZED = { code: 2001, message: "Unauthorized" }

const toUser = ({ id, email }: typeof READER): UserPostgresEntity => ({
  id,
  email,
  username: email,
  createdAt: new Date(),
})

const createUserStore = (): Pick<UserPostgresService, "findByEmail"> => {
  const users = [toUser(READER), toUser(OTHER_READER)]

  return {
    findByEmail: async (email) =>
      users.find((user) => user.email === normalizeEmail(email)) ?? null,
  }
}

const createKoreaderSyncStore = (): Pick<
  KoreaderSyncPostgresService,
  | "findCredentialByUserId"
  | "saveCredential"
  | "findProgress"
  | "saveProgress"
  | "deleteByUserId"
> => {
  const credentials = new Map<number, KoreaderSyncCredentialPostgresEntity>()
  const progresses = new Map<string, KoreaderSyncProgressPostgresEntity>()
  const toProgressKey = (userId: number, document: string) =>
    `${userId}/${document}`

  return {
    findCredentialByUserId: async (userId) => credentials.get(userId) ?? null,
    saveCredential: async ({ userId, keyHash }) => {
      credentials.set(userId, {
        id: userId,
        user_id: userId,
        key_hash: keyHash,
        created_at: new Date(),
      })
    },
    findProgress: async ({ userId, document }) =>
      progresses.get(toProgressKey(userId, document)) ?? null,
    saveProgress: async (progress: KoreaderSyncProgress) => {
      progresses.set(toProgressKey(progress.user_id, progress.document), {
        id: progresses.size + 1,
        ...progress,
      })
    },
    deleteByUserId: async (userId) => {
      credentials.delete(userId)

      for (const [key, progress] of progresses) {
        if (progress.user_id === userId) progresses.delete(key)
      }
    },
  }
}

describe("KoreaderSyncProtocolController", () => {
  let app: INestApplication<App>
  let koreaderSyncService: KoreaderSyncService
  let readerKey: string

  const authorizedAs = (username: string, key: string) => ({
    "x-auth-user": username,
    "x-auth-key": key,
  })

  const asReader = () => authorizedAs(READER.email, readerKey)

  const pushProgress = (
    body: Record<string, unknown>,
    headers: Record<string, string> = asReader(),
  ) =>
    request(app.getHttpServer())
      .put("/kosync/syncs/progress")
      .set(headers)
      .set("Accept", "application/vnd.koreader.v1+json")
      .send(body)

  const pullProgress = (
    document: string,
    headers: Record<string, string> = asReader(),
  ) =>
    request(app.getHttpServer())
      .get(`/kosync/syncs/progress/${document}`)
      .set(headers)

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [KoreaderSyncProtocolController],
      providers: [
        KoreaderSyncService,
        KoreaderSyncAuthGuard,
        { provide: UserPostgresService, useValue: createUserStore() },
        {
          provide: KoreaderSyncPostgresService,
          useValue: createKoreaderSyncStore(),
        },
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockRejectedValue(new Error("no session")),
          },
        },
        { provide: SecretsService, useValue: { getJwtPublicKey: jest.fn() } },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    koreaderSyncService = module.get(KoreaderSyncService)
    readerKey = toSyncKey(await koreaderSyncService.createPassword(READER.id))
  })

  afterEach(async () => {
    await app.close()
  })

  it("answers the healthcheck without credentials", async () => {
    const response = await request(app.getHttpServer()).get(
      "/kosync/healthcheck",
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ state: "OK" })
  })

  it("refuses registration with the status KOReader expects for it", async () => {
    const response = await request(app.getHttpServer())
      .post("/kosync/users/create")
      .send({ username: "new-reader", password: toSyncKey("password") })

    expect(response.status).toBe(402)
    expect(response.body).toMatchObject({ code: 2005 })
  })

  describe("GET /users/auth", () => {
    it("authorizes the account email with the MD5 of the generated password", async () => {
      const response = await request(app.getHttpServer())
        .get("/kosync/users/auth")
        .set(asReader())

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ authorized: "OK" })
    })

    it("matches the email however it is cased", async () => {
      const response = await request(app.getHttpServer())
        .get("/kosync/users/auth")
        .set(authorizedAs(" Reader@Example.com", readerKey))

      expect(response.status).toBe(200)
    })

    it.each([
      ["no headers", {}],
      ["a wrong key", authorizedAs(READER.email, toSyncKey("guess"))],
      ["an unknown user", authorizedAs("nobody@example.com", toSyncKey("x"))],
      [
        "a user who never generated a password",
        authorizedAs(OTHER_READER.email, toSyncKey("")),
      ],
    ])("refuses %s", async (_, headers) => {
      const response = await request(app.getHttpServer())
        .get("/kosync/users/auth")
        .set(headers)

      expect(response.status).toBe(401)
      expect(response.body).toEqual(UNAUTHORIZED)
    })

    it("refuses the previous password once a new one is generated", async () => {
      const previousKey = readerKey
      await koreaderSyncService.createPassword(READER.id)

      const response = await request(app.getHttpServer())
        .get("/kosync/users/auth")
        .set(authorizedAs(READER.email, previousKey))

      expect(response.status).toBe(401)
    })

    it("refuses every device once sync is turned off", async () => {
      await koreaderSyncService.turnOff(READER.id)

      const response = await request(app.getHttpServer())
        .get("/kosync/users/auth")
        .set(asReader())

      expect(response.status).toBe(401)
    })
  })

  describe("progress", () => {
    const koreaderPush = {
      document: DOCUMENT,
      progress: XPOINTER,
      percentage: 0.3219,
      device: "Kobo Libra 2",
      device_id: "8B5C5E1B3F0C4F2E9A1D",
    }

    it("stores a push and serves it back with the time it was received", async () => {
      const before = Math.floor(Date.now() / 1000)

      const pushed = await pushProgress(koreaderPush)

      expect(pushed.status).toBe(200)
      expect(pushed.body).toEqual({
        document: DOCUMENT,
        timestamp: expect.any(Number),
      })
      expect(pushed.body.timestamp).toBeGreaterThanOrEqual(before)

      const pulled = await pullProgress(DOCUMENT)

      expect(pulled.status).toBe(200)
      expect(pulled.body).toEqual({
        ...koreaderPush,
        timestamp: pushed.body.timestamp,
      })
    })

    it("keeps only the latest push of a document", async () => {
      await pushProgress(koreaderPush)
      await pushProgress({
        ...koreaderPush,
        progress: "/body/DocFragment[15]/body/p[1]/text().0",
        percentage: 0.35,
        device: "Readest",
        device_id: "readest-phone",
      })

      const pulled = await pullProgress(DOCUMENT)

      expect(pulled.body).toMatchObject({
        progress: "/body/DocFragment[15]/body/p[1]/text().0",
        percentage: 0.35,
        device: "Readest",
        device_id: "readest-phone",
      })
    })

    it("answers an empty object for a document never pushed", async () => {
      const pulled = await pullProgress("ffffffffffffffffffffffffffffffff")

      expect(pulled.status).toBe(200)
      expect(pulled.body).toEqual({})
    })

    it("keeps each user's documents apart", async () => {
      await pushProgress(koreaderPush)
      const otherKey = toSyncKey(
        await koreaderSyncService.createPassword(OTHER_READER.id),
      )

      const pulled = await pullProgress(
        DOCUMENT,
        authorizedAs(OTHER_READER.email, otherKey),
      )

      expect(pulled.body).toEqual({})
    })

    it("takes a page number and a numeric percentage string, as clients of books with pages send", async () => {
      await pushProgress({ ...koreaderPush, progress: 56, percentage: "0.5" })

      const pulled = await pullProgress(DOCUMENT)

      expect(pulled.body).toMatchObject({ progress: "56", percentage: 0.5 })
    })

    it("omits the device id when the push had none", async () => {
      const { device_id: _, ...pushWithoutDeviceId } = koreaderPush

      await pushProgress(pushWithoutDeviceId)

      const pulled = await pullProgress(DOCUMENT)

      expect(pulled.body).not.toHaveProperty("device_id")
    })

    it.each([
      ["without a document", { document: undefined }, 2004],
      ["with an empty document", { document: "" }, 2004],
      ["with a document it could not serve back", { document: "a:b" }, 2007],
      ["without progress", { progress: undefined }, 2003],
      ["without a percentage", { percentage: undefined }, 2003],
      ["with a percentage that is not a number", { percentage: "half" }, 2003],
      ["without a device", { device: undefined }, 2003],
      ["with a device id that is not a string", { device_id: 12 }, 2003],
      ["with an oversized progress", { progress: "x".repeat(4097) }, 2003],
    ])("refuses a push %s", async (_, override, code) => {
      const pushed = await pushProgress({ ...koreaderPush, ...override })

      expect(pushed.status).toBe(403)
      expect(pushed.body).toMatchObject({ code })
    })

    it("refuses to push or pull without valid credentials", async () => {
      const wrongCredentials = authorizedAs(READER.email, toSyncKey("guess"))

      const pushed = await pushProgress(koreaderPush, wrongCredentials)
      const pulled = await pullProgress(DOCUMENT, wrongCredentials)

      expect(pushed.status).toBe(401)
      expect(pushed.body).toEqual(UNAUTHORIZED)
      expect(pulled.status).toBe(401)
      expect(pulled.body).toEqual(UNAUTHORIZED)
    })

    it("forgets the pushed positions once sync is turned off", async () => {
      await pushProgress(koreaderPush)
      await koreaderSyncService.turnOff(READER.id)
      readerKey = toSyncKey(await koreaderSyncService.createPassword(READER.id))

      const pulled = await pullProgress(DOCUMENT)

      expect(pulled.body).toEqual({})
    })
  })
})
