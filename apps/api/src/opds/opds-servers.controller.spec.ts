import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import { humanId } from "human-id"
import { BehaviorSubject } from "rxjs"
import request from "supertest"
import type { App } from "supertest/types.js"
import {
  type InstanceConfig,
  InstanceConfigService,
} from "../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { isSecretMatchingHash } from "../crypto/secretHash.js"
import type { OpdsServerPostgresEntity } from "../features/postgres/entities.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"
import { OpdsServersController } from "./opds-servers.controller.js"
import { OpdsServersService } from "./opds-servers.service.js"

vi.mock("human-id", async function mockHumanId(importOriginal) {
  const humanIdModule = await importOriginal<typeof import("human-id")>()

  return { ...humanIdModule, humanId: vi.fn(humanIdModule.humanId) }
})

const READER = { id: 1, email: "reader@example.com", session: "reader" }
const OTHER_READER = { id: 2, email: "other@example.com", session: "other" }

const toTokenPayload = ({
  id,
  email,
}: {
  id: number
  email: string
}): TokenPayload => ({
  name: email,
  sub: email,
  userId: id,
  "couchdb.roles": [],
})

const TOKEN_PAYLOADS = new Map([
  [READER.session, toTokenPayload(READER)],
  [OTHER_READER.session, toTokenPayload(OTHER_READER)],
])

const SERVER_LIMIT = 3

const INSTANCE_CONFIG: InstanceConfig = {
  version: 1,
  serverSync: { enabled: false, credentials: null, sources: [] },
  showDisabledPlugins: true,
  fileDownloadMaxSizeBytes: 1,
  allowPrivateNetworkRequests: false,
  privateNetworkAllowedHosts: [],
  opdsServersMaxPerUser: SERVER_LIMIT,
}

const instanceConfigService: Pick<InstanceConfigService, "getConfig"> = {
  getConfig: () => new BehaviorSubject(INSTANCE_CONFIG),
}

const SLUG_PATTERN = /^[a-z]+-[a-z]+-[a-z]+$/
const PASSWORD_PATTERN = /^[a-hjkmnp-z2-9]{4}(-[a-hjkmnp-z2-9]{4}){3}$/

const createServerStore = () => {
  const servers = new Map<number, OpdsServerPostgresEntity>()

  const findUserServer = ({ userId, id }: { userId: number; id: number }) => {
    const server = servers.get(id)

    return server?.user_id === userId ? server : undefined
  }

  const updateUserServer = (
    { userId, id }: { userId: number; id: number },
    changes: Partial<OpdsServerPostgresEntity>,
  ) => {
    const server = findUserServer({ userId, id })

    if (!server) return null

    const updatedServer = { ...server, ...changes }

    servers.set(id, updatedServer)

    return updatedServer
  }

  const findUserServers = (userId: number) =>
    [...servers.values()].filter((server) => server.user_id === userId)

  const isSlugTaken = (slug: string) =>
    [...servers.values()].some((server) => server.slug === slug)

  const store: Pick<
    OpdsServerPostgresService,
    | "findByUserId"
    | "insertUnderLimit"
    | "rename"
    | "replacePasswordHash"
    | "delete"
  > = {
    findByUserId: async (userId) => findUserServers(userId),
    insertUnderLimit: async ({
      userId,
      maxServers,
      passwordHash,
      candidates,
    }) => {
      const isUnderLimit = findUserServers(userId).length < maxServers

      if (!isUnderLimit) return { status: "limit-reached" }

      const freeCandidate = candidates.find(
        (candidate) => !isSlugTaken(candidate.slug),
      )

      if (!freeCandidate) return { status: "slugs-taken" }

      const server: OpdsServerPostgresEntity = {
        id: Math.max(0, ...servers.keys()) + 1,
        user_id: userId,
        slug: freeCandidate.slug,
        name: freeCandidate.name,
        password_hash: passwordHash,
        created_at: new Date(),
      }

      servers.set(server.id, server)

      return { status: "created", server }
    },
    rename: async ({ userId, id, name }) =>
      updateUserServer({ userId, id }, { name }),
    replacePasswordHash: async ({ userId, id, passwordHash }) =>
      updateUserServer({ userId, id }, { password_hash: passwordHash }),
    delete: async ({ userId, id }) =>
      findUserServer({ userId, id }) ? servers.delete(id) : false,
  }

  return { store, servers }
}

describe("OpdsServersController", () => {
  let app: INestApplication<App>
  let servers: Map<number, OpdsServerPostgresEntity>

  const asReader = (session: string) => ({
    list: () =>
      request(app.getHttpServer())
        .get("/opds-servers")
        .set("Authorization", `Bearer ${session}`),
    create: () =>
      request(app.getHttpServer())
        .post("/opds-servers")
        .set("Authorization", `Bearer ${session}`),
    rename: (id: number, body: Record<string, unknown>) =>
      request(app.getHttpServer())
        .patch(`/opds-servers/${id}`)
        .set("Authorization", `Bearer ${session}`)
        .send(body),
    regeneratePassword: (id: number) =>
      request(app.getHttpServer())
        .post(`/opds-servers/${id}/password`)
        .set("Authorization", `Bearer ${session}`),
    delete: (id: number) =>
      request(app.getHttpServer())
        .delete(`/opds-servers/${id}`)
        .set("Authorization", `Bearer ${session}`),
  })

  const reader = () => asReader(READER.session)
  const otherReader = () => asReader(OTHER_READER.session)

  beforeEach(async () => {
    const serverStore = createServerStore()
    servers = serverStore.servers

    const module = await Test.createTestingModule({
      controllers: [OpdsServersController],
      providers: [
        OpdsServersService,
        { provide: OpdsServerPostgresService, useValue: serverStore.store },
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: async (token: string) => {
              const payload = TOKEN_PAYLOADS.get(token)

              if (!payload) throw new Error("no session")

              return payload
            },
          },
        },
        {
          provide: SecretsService,
          useValue: { getJwtPublicKey: async () => "public key" },
        },
        { provide: InstanceConfigService, useValue: instanceConfigService },
      ],
    }).compile()

    app = module.createNestApplication({ logger: false })
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  afterEach(async () => {
    vi.mocked(humanId).mockReset()
    await app.close()
  })

  it("refuses a request without a session", async () => {
    const response = await request(app.getHttpServer()).get("/opds-servers")

    expect(response.status).toBe(401)
  })

  it("creates a server with a readable slug and a password shown once", async () => {
    const response = await reader().create()

    expect(response.status).toBe(201)

    const { server, password } = response.body

    expect(server).toEqual({
      id: expect.any(Number),
      slug: expect.stringMatching(SLUG_PATTERN),
      name: expect.any(String),
      username: READER.email,
      createdAt: expect.any(String),
    })
    expect(password).toMatch(PASSWORD_PATTERN)

    const storedHash = servers.get(server.id)?.password_hash ?? ""

    expect(storedHash).not.toContain(password)
    expect(isSecretMatchingHash(password, storedHash)).toBe(true)
  })

  it("lists only the signed-in user's servers, without passwords", async () => {
    const first = await reader().create()
    const second = await reader().create()
    await otherReader().create()

    const response = await reader().list()

    expect(response.status).toBe(200)
    expect(response.body).toEqual([first.body.server, second.body.server])
  })

  it("renames a server", async () => {
    const { body } = await reader().create()

    const response = await reader().rename(body.server.id, {
      name: "Kids' books",
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ...body.server, name: "Kids' books" })
    expect((await reader().list()).body).toEqual([response.body])
  })

  it.each([
    ["an empty name", ""],
    ["a blank name", "   "],
    ["a name over 100 characters", "a".repeat(101)],
    ["a name that is not a string", 42],
  ])("refuses %s", async (_, name) => {
    const { body } = await reader().create()

    const response = await reader().rename(body.server.id, { name })

    expect(response.status).toBe(400)
  })

  it("regenerates the password and forgets the previous one", async () => {
    const { body } = await reader().create()

    const response = await reader().regeneratePassword(body.server.id)

    expect(response.status).toBe(201)
    expect(response.body.server).toEqual(body.server)

    const storedHash = servers.get(body.server.id)?.password_hash ?? ""

    expect(isSecretMatchingHash(response.body.password, storedHash)).toBe(true)
    expect(isSecretMatchingHash(body.password, storedHash)).toBe(false)
  })

  it("deletes a server", async () => {
    const { body } = await reader().create()

    const response = await reader().delete(body.server.id)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
    expect((await reader().list()).body).toEqual([])
  })

  it("never changes another user's server", async () => {
    const { body } = await otherReader().create()
    const storedServer = servers.get(body.server.id)

    const responses = [
      await reader().rename(body.server.id, { name: "Mine now" }),
      await reader().regeneratePassword(body.server.id),
      await reader().delete(body.server.id),
    ]

    expect(responses.map(({ status }) => status)).toEqual([404, 404, 404])
    expect(servers.get(body.server.id)).toEqual(storedServer)
  })

  it("tries new words when the slug is taken", async () => {
    vi.mocked(humanId).mockReturnValueOnce("calm-snails-dream")
    await otherReader().create()
    vi.mocked(humanId)
      .mockReturnValueOnce("calm-snails-dream")
      .mockReturnValueOnce("brave-foxes-run")

    const response = await reader().create()

    expect(response.status).toBe(201)
    expect(response.body.server).toMatchObject({
      slug: "brave-foxes-run",
      name: "Brave foxes run",
    })
  })

  it("fails after 5 slugs that are all taken", async () => {
    vi.mocked(humanId).mockReturnValue("calm-snails-dream")
    await otherReader().create()
    vi.mocked(humanId).mockClear()

    const response = await reader().create()

    expect(response.status).toBe(500)
    expect(humanId).toHaveBeenCalledTimes(5)
    expect((await reader().list()).body).toEqual([])
  })

  it("refuses a server past the instance's limit per user", async () => {
    for (let created = 0; created < SERVER_LIMIT; created++) {
      await reader().create()
    }

    const response = await reader().create()

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_OPDS_SERVER_LIMIT_REACHED }],
    })
    expect((await reader().list()).body).toHaveLength(SERVER_LIMIT)
  })
})
