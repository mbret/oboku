import { describe, expect, it } from "vitest"
import { getOpdsCredentialHeaders, isOpdsConnectorOrigin } from "./index"

const connectorUrl = "https://catalog.example.com/opds"

describe("isOpdsConnectorOrigin", () => {
  it("accepts any path on the connector's origin", () => {
    expect(
      isOpdsConnectorOrigin(
        "https://catalog.example.com/books/1/file.epub",
        connectorUrl,
      ),
    ).toBe(true)
  })

  it.each([
    "https://cdn.example.com/books/1/file.epub",
    "https://files.catalog.example.com/books/1/file.epub",
    "http://catalog.example.com/books/1/file.epub",
    "https://catalog.example.com:8443/books/1/file.epub",
  ])("refuses %s, on another origin", (url) => {
    expect(isOpdsConnectorOrigin(url, connectorUrl)).toBe(false)
  })

  it("refuses everything for a connector URL without a scheme", () => {
    expect(
      isOpdsConnectorOrigin(
        "https://catalog.example.com/opds",
        "catalog.example.com/opds",
      ),
    ).toBe(false)
  })

  it("refuses URLs that are not http(s)", () => {
    expect(
      isOpdsConnectorOrigin("ftp://catalog.example.com/opds", connectorUrl),
    ).toBe(false)
  })
})

describe("getOpdsCredentialHeaders", () => {
  const connector = {
    url: connectorUrl,
    username: "reader",
    password: "pässwörd",
  }

  it("sends UTF-8 Basic credentials to the connector's origin", () => {
    const { Authorization } = getOpdsCredentialHeaders(
      "https://catalog.example.com/opds/books",
      connector,
    )
    const credentials = Authorization?.replace(/^Basic /, "") ?? ""
    const decodedCredentials = new TextDecoder().decode(
      Uint8Array.from(atob(credentials), (character) =>
        character.charCodeAt(0),
      ),
    )

    expect(decodedCredentials).toBe("reader:pässwörd")
  })

  it("sends nothing to another origin", () => {
    expect(
      getOpdsCredentialHeaders("https://cdn.example.com/1.epub", connector),
    ).toEqual({})
  })
})
