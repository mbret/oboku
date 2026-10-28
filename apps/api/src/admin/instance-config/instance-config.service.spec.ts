import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { InstanceConfigService } from "./instance-config.service.js"
import { ServerSourcesService } from "./server-sources.service.js"

describe("InstanceConfigService", () => {
  let configDir: string
  let configFile: string
  let service: InstanceConfigService | undefined

  const startService = () => {
    service = new InstanceConfigService(
      { CONFIG_DIR: configDir, CONFIG_FILE: configFile },
      new ServerSourcesService(),
    )

    return service
  }

  beforeEach(() => {
    configDir = fs.mkdtempSync(path.join(os.tmpdir(), "oboku-instance-"))
    configFile = path.join(configDir, "config.json")
  })

  afterEach(() => {
    service?.onModuleDestroy()
    service = undefined
    fs.rmSync(configDir, { recursive: true, force: true })
  })

  it("lets each user keep 10 OPDS servers when an existing config has no limit", () => {
    fs.writeFileSync(configFile, JSON.stringify({ version: 1 }))

    expect(startService().getConfig().value.opdsServersMaxPerUser).toBe(10)
  })
})
