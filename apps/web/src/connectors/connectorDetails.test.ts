import { describe, expect, it } from "vitest"
import { isSettingsConnectorType } from "./connectorDetails"

describe("isSettingsConnectorType", () => {
  it("accepts the type of a plugin that has connectors", () => {
    expect(isSettingsConnectorType("webdav")).toBe(true)
  })

  it("rejects the type of a plugin without connectors", () => {
    expect(isSettingsConnectorType("dropbox")).toBe(false)
  })

  it("rejects a route param that names no plugin, even an object property", () => {
    expect(isSettingsConnectorType(undefined)).toBe(false)
    expect(isSettingsConnectorType("unknown")).toBe(false)
    expect(isSettingsConnectorType("toString")).toBe(false)
  })
})
