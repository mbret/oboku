import type { InstanceConfig } from "./instance-config/instance-config.service.js"
import { toInstanceSettings } from "./instance-settings.js"

const CONFIG: InstanceConfig = {
  version: 2,
  serverSync: { enabled: false, credentials: null, sources: [] },
  googleClientId: "client-id",
  googleApiKey: "api-key",
  showDisabledPlugins: true,
  fileDownloadMaxSizeBytes: 1,
  allowPrivateNetworkRequests: false,
  privateNetworkAllowedHosts: [],
  opdsServersMaxPerUser: 10,
}

describe("toInstanceSettings", () => {
  it("says the Google client secret is set without returning it", () => {
    const settings = toInstanceSettings({
      ...CONFIG,
      googleClientSecret: "client-secret",
    })

    expect(settings).toMatchObject({
      googleClientId: "client-id",
      googleApiKey: "api-key",
      googleClientSecretConfigured: true,
    })
    expect(JSON.stringify(settings)).not.toContain("client-secret")
  })

  it("says the Google client secret is not set", () => {
    expect(toInstanceSettings(CONFIG).googleClientSecretConfigured).toBe(false)
  })
})
