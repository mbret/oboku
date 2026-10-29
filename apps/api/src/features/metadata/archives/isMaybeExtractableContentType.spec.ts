import { describe, expect, it } from "vitest"
import { isMaybeExtractableContentType } from "./isMaybeExtractableContentType.js"

describe("isMaybeExtractableContentType", () => {
  it("may extract a file its source gives no type", () => {
    expect(isMaybeExtractableContentType(undefined)).toBe(true)
    expect(isMaybeExtractableContentType("")).toBe(true)
  })

  it("extracts an archive type whatever its parameters", () => {
    expect(
      isMaybeExtractableContentType("application/x-rar-compressed; version=4"),
    ).toBe(true)
  })

  it("extracts a CBR reported with Nextcloud's type", () => {
    expect(isMaybeExtractableContentType("application/comicbook+rar")).toBe(
      true,
    )
  })

  it("does not extract a type that holds no archive", () => {
    expect(isMaybeExtractableContentType("application/pdf")).toBe(false)
  })
})
