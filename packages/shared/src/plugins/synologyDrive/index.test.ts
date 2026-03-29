import { describe, expect, it } from "vitest"
import { PLUGIN_SYNOLOGY_DRIVE_TYPE } from "./index"

describe("Synology Drive plugin", () => {
  it("exports the correct plugin type", () => {
    expect(PLUGIN_SYNOLOGY_DRIVE_TYPE).toBe("synology-drive")
  })
})
