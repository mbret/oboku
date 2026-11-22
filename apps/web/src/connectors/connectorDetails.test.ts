import { describe, expect, it } from "vitest"
import { isSettingsConnectorType, toConnectorLabel } from "./connectorDetails"

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

describe("toConnectorLabel", () => {
  it("shows the url and the username of a connector with a url", () => {
    expect(
      toConnectorLabel({ url: "https://dav.example.com", username: "reader" }),
    ).toBe("https://dav.example.com (reader)")
  })

  it("shows the username alone for a connector without a url", () => {
    expect(toConnectorLabel({ username: "reader" })).toBe("reader")
    expect(toConnectorLabel({ url: "", username: "reader" })).toBe("reader")
  })
})
