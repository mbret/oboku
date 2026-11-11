import { Test } from "@nestjs/testing"
import { BehaviorSubject } from "rxjs"
import {
  type InstanceConfig,
  InstanceConfigService,
} from "../admin/instance-config/instance-config.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
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
}

const createController = async (config: InstanceConfig) => {
  const module = await Test.createTestingModule({
    controllers: [WebController],
    providers: [
      { provide: AppConfigService, useValue: {} },
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
    const withoutSecret = (
      await createController({ ...CONFIG, googleClientSecret: undefined })
    ).getConfig()

    expect(configured.FEATURE_GOOGLE_CONNECTION_ENABLED).toBe(true)
    expect(withoutSecret.FEATURE_GOOGLE_CONNECTION_ENABLED).toBe(false)
  })
})
