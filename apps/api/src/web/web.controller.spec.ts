import { Test } from "@nestjs/testing"
import { BehaviorSubject } from "rxjs"
import {
  type InstanceConfig,
  InstanceConfigService,
} from "../admin/instance-config/instance-config.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { KINDLE_MAX_SENDS_PER_USER_PER_DAY } from "../kindle/kindle-daily-sends.service.js"
import { WebController } from "./web.controller.js"

const CONFIG: InstanceConfig = {
  version: 2,
  serverSync: { enabled: false, credentials: null, sources: [] },
  googleClientId: "client-id",
  googleApiKey: "api-key",
  googleClientSecret: "client-secret",
  showDisabledPlugins: true,
  fileDownloadMaxSizeBytes: 1,
  allowPrivateNetworkRequests: false,
  privateNetworkAllowedHosts: [],
  opdsServersMaxPerUser: 10,
  proxiedDownloadBytesMaxPerMonth: 1,
  proxiedDownloadUserQuota: { type: "percentage", percent: 5 },
}

const EMAIL_DELIVERY_SETTINGS = {
  EMAIL_SMTP_HOST: "smtp.oboku.example",
  EMAIL_FROM: "books@oboku.example",
  SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES: 25_000_000,
}

const createController = async (
  config: InstanceConfig,
  environment: Partial<typeof EMAIL_DELIVERY_SETTINGS> = {},
) => {
  const module = await Test.createTestingModule({
    controllers: [WebController],
    providers: [
      { provide: AppConfigService, useValue: environment },
      {
        provide: InstanceConfigService,
        useValue: { getConfig: () => new BehaviorSubject(config) },
      },
    ],
  }).compile()

  return module.get(WebController)
}

describe("WebController", () => {
  it("gives the web app Google's client id and API key from the instance config, never its secret", async () => {
    const config = (await createController(CONFIG)).getConfig()

    expect(config).toMatchObject({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_API_KEY: "api-key",
    })
    expect(JSON.stringify(config)).not.toContain("client-secret")
  })

  it("turns the Google connection on once the client id and secret are both set", async () => {
    const configured = (await createController(CONFIG)).getConfig()
    const withoutClientId = (
      await createController({ ...CONFIG, googleClientId: undefined })
    ).getConfig()
    const withoutSecret = (
      await createController({ ...CONFIG, googleClientSecret: undefined })
    ).getConfig()

    expect(configured.FEATURE_GOOGLE_CONNECTION_ENABLED).toBe(true)
    expect(withoutClientId.FEATURE_GOOGLE_CONNECTION_ENABLED).toBe(false)
    expect(withoutSecret.FEATURE_GOOGLE_CONNECTION_ENABLED).toBe(false)
  })

  it("gives the web app the sender address and the limits of Send to Kindle on an instance that sends emails", async () => {
    const config = (
      await createController(CONFIG, EMAIL_DELIVERY_SETTINGS)
    ).getConfig()

    expect(config.SEND_TO_KINDLE).toEqual({
      senderAddress: EMAIL_DELIVERY_SETTINGS.EMAIL_FROM,
      maxFileSizeBytes:
        EMAIL_DELIVERY_SETTINGS.SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES,
      maxSendsPerDay: KINDLE_MAX_SENDS_PER_USER_PER_DAY,
    })
  })

  it.each([
    [
      "no SMTP host",
      { ...EMAIL_DELIVERY_SETTINGS, EMAIL_SMTP_HOST: undefined },
    ],
    [
      "no sender address",
      { ...EMAIL_DELIVERY_SETTINGS, EMAIL_FROM: undefined },
    ],
  ])(
    "gives no Send to Kindle settings on an instance with %s",
    async (_case, environment) => {
      const config = (await createController(CONFIG, environment)).getConfig()

      expect(config.SEND_TO_KINDLE).toBeUndefined()
    },
  )
})
