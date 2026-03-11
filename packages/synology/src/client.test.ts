import { describe, expect, it } from "vitest"
import { normalizeSynologyDriveBaseUrl } from "./client"

describe("Synology package helpers", () => {
  it("normalizes trailing slashes and strips search params", () => {
    expect(
      normalizeSynologyDriveBaseUrl(
        "https://nas.example.com:5001/drive/?foo=bar#hash",
      ),
    ).toBe("https://nas.example.com:5001/drive")
  })
})
