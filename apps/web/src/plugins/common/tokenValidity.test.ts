import { describe, expect, it } from "vitest"
import { hasMinimumValidityLeft } from "./tokenValidity"

describe("hasMinimumValidityLeft", () => {
  it("returns true when the token expires after the minimum validity window", () => {
    expect(
      hasMinimumValidityLeft({
        expiresAt: new Date("2026-04-12T10:10:00.000Z"),
        minimumValidityMs: 5 * 60 * 1000,
        now: new Date("2026-04-12T10:00:00.000Z").getTime(),
      }),
    ).toBe(true)
  })

  it("returns false when the token expires too soon", () => {
    expect(
      hasMinimumValidityLeft({
        expiresAt: new Date("2026-04-12T10:04:59.000Z"),
        minimumValidityMs: 5 * 60 * 1000,
        now: new Date("2026-04-12T10:00:00.000Z").getTime(),
      }),
    ).toBe(false)
  })

  it("returns false when expiration is missing", () => {
    expect(
      hasMinimumValidityLeft({
        expiresAt: undefined,
        minimumValidityMs: 5 * 60 * 1000,
        now: new Date("2026-04-12T10:00:00.000Z").getTime(),
      }),
    ).toBe(false)
  })
})
