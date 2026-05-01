import { describe, expect, it } from "vitest"
import { formatBytes } from "./formatBytes"

describe("formatBytes", () => {
  it("returns undefined for nullish, empty or invalid inputs", () => {
    expect(formatBytes(undefined)).toBeUndefined()
    expect(formatBytes(null)).toBeUndefined()
    expect(formatBytes("")).toBeUndefined()
    expect(formatBytes("not-a-number")).toBeUndefined()
    expect(formatBytes(-1)).toBeUndefined()
    expect(formatBytes(Number.NaN)).toBeUndefined()
  })

  it("formats bytes below 1KB without decimals", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(999)).toBe("999 B")
  })

  it("formats KB / MB / GB with one decimal", () => {
    expect(formatBytes(1000)).toBe("1.0 KB")
    expect(formatBytes(1500)).toBe("1.5 KB")
    expect(formatBytes(1000 ** 2)).toBe("1.0 MB")
    expect(formatBytes(1000 ** 3)).toBe("1.0 GB")
    expect(formatBytes(1000 ** 3 * 4.2)).toBe("4.2 GB")
  })

  it("accepts numeric strings (some providers expose size as text)", () => {
    expect(formatBytes("0")).toBe("0 B")
    expect(formatBytes("2000")).toBe("2.0 KB")
    expect(formatBytes(`${1000 ** 2 * 95}`)).toBe("95.0 MB")
  })
})
