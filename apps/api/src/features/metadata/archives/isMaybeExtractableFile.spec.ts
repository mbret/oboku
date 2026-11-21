import { describe, expect, it } from "vitest"
import { isMaybeExtractableFile } from "./isMaybeExtractableFile.js"

const PDF_NAME = "Dune.pdf"

describe("isMaybeExtractableFile", () => {
  it("may extract a file its source gives no type", () => {
    expect(
      isMaybeExtractableFile({ contentType: undefined, name: PDF_NAME }),
    ).toBe(true)
    expect(isMaybeExtractableFile({ contentType: "", name: PDF_NAME })).toBe(
      true,
    )
  })

  it("may extract a file its source types as bytes of an unknown type", () => {
    expect(
      isMaybeExtractableFile({
        contentType: "application/octet-stream",
        name: PDF_NAME,
      }),
    ).toBe(true)
  })

  it("extracts an archive type whatever its parameters", () => {
    expect(
      isMaybeExtractableFile({
        contentType: "application/x-rar-compressed; version=4",
        name: undefined,
      }),
    ).toBe(true)
  })

  it("extracts a zip archive", () => {
    expect(
      isMaybeExtractableFile({
        contentType: "application/x-cbz",
        name: undefined,
      }),
    ).toBe(true)
  })

  it("extracts a CBZ reported with Nextcloud's type", () => {
    expect(
      isMaybeExtractableFile({
        contentType: "application/comicbook+zip",
        name: undefined,
      }),
    ).toBe(true)
  })

  it("extracts a CBR reported with Nextcloud's type", () => {
    expect(
      isMaybeExtractableFile({
        contentType: "application/comicbook+rar",
        name: undefined,
      }),
    ).toBe(true)
  })

  it("may extract a file named like an archive whatever type its source gives", () => {
    expect(
      isMaybeExtractableFile({
        contentType: "binary/octet-stream",
        name: "Batman #12.CBZ",
      }),
    ).toBe(true)
    expect(
      isMaybeExtractableFile({
        contentType: "application/x-unknown",
        name: "Akira.cbr",
      }),
    ).toBe(true)
  })

  it("does not extract a type that holds no archive", () => {
    expect(
      isMaybeExtractableFile({
        contentType: "application/pdf",
        name: PDF_NAME,
      }),
    ).toBe(false)
  })
})
