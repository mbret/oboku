import type { INestApplication } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types.js"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import { ProxiedDownloadQuotaService } from "./proxied-download-quota.service.js"
import { QuotasController } from "./quotas.controller.js"

const QUOTA_BYTES = 500 * 1000 ** 3
const USED_BYTES = 12 * 1000 ** 3
const READER_SESSION = "reader-session"

const readerTokenPayload: TokenPayload = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: 1,
  "couchdb.roles": [],
}

describe("QuotasController", () => {
  let app: INestApplication<App>
  const findBytes = vi.fn()

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-11-14T21:00:00.000Z"))
    findBytes.mockResolvedValue(USED_BYTES)

    const module = await Test.createTestingModule({
      controllers: [QuotasController],
      providers: [
        ProxiedDownloadQuotaService,
        {
          provide: ProxiedDownloadUsagePostgresService,
          useValue: { findBytes },
        },
        {
          provide: InstanceConfigService,
          useValue: {
            getConfig: () => ({
              value: { proxiedDownloadBytesMaxPerMonth: QUOTA_BYTES },
            }),
          },
        },
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: async (token: string) => {
              if (token !== READER_SESSION) throw new Error("no session")

              return readerTokenPayload
            },
          },
        },
        {
          provide: SecretsService,
          useValue: { getJwtPublicKey: async () => "public key" },
        },
      ],
    }).compile()

    app = module.createNestApplication({ logger: false })
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("answers this month's proxied download usage, the quota and when the next month starts", async () => {
    const response = await request(app.getHttpServer())
      .get("/quotas/proxied-downloads")
      .set("Authorization", `Bearer ${READER_SESSION}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      usedBytes: USED_BYTES,
      quotaBytes: QUOTA_BYTES,
      resetsAt: "2026-12-01T00:00:00.000Z",
    })
    expect(findBytes).toHaveBeenCalledWith("2026-11-01")
  })

  it("answers 401 without a session", async () => {
    const response = await request(app.getHttpServer()).get(
      "/quotas/proxied-downloads",
    )

    expect(response.status).toBe(401)
    expect(findBytes).not.toHaveBeenCalled()
  })
})
