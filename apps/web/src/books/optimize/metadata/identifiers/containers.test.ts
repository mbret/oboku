// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
  hasWritableMetadataTarget,
  identifierDestinations,
  resolveMetadataTargets,
} from "./containers"
import { CONTAINER_XML, comicInfo, inspect, opf } from "./inspection.fixture"

describe("identifierDestinations", function testIdentifierDestinations() {
  const both = { comicInfo: true, opf: true }
  const comicInfoOnly = { comicInfo: true }

  it("keeps a scheme ComicInfo cannot represent out of it", function excludeComicInfo() {
    expect(identifierDestinations([{ scheme: "AcmeCatalog" }], both)).toEqual([
      ["opf"],
    ])
    expect(
      identifierDestinations([{ scheme: "AcmeCatalog" }], comicInfoOnly),
    ).toEqual([[]])
  })

  it("stores identifiers ComicInfo has a field for in both containers", function includeComicInfo() {
    for (const scheme of [
      "ISBN",
      "GTIN",
      "URL",
      "GoogleBooks",
      "ProjectGutenberg",
      "OpenLibrary",
      "DOI",
    ]) {
      expect(identifierDestinations([{ scheme }], both)).toEqual([
        ["comicInfo", "opf"],
      ])
    }
  })

  it("gives ComicInfo's single GTIN field to the first ISBN-bearing identifier only", function shareOneGtinField() {
    expect(
      identifierDestinations([{ scheme: "ISBN" }, { scheme: "GTIN" }], both),
    ).toEqual([["comicInfo", "opf"], ["opf"]])
    expect(
      identifierDestinations(
        [{ scheme: "ISBN" }, { scheme: "ISBN" }],
        comicInfoOnly,
      ),
    ).toEqual([["comicInfo"], []])
  })

  it("lets several links share the Web field", function shareWebField() {
    expect(
      identifierDestinations(
        [{ scheme: "URL" }, { scheme: "GoogleBooks" }, { scheme: "DOI" }],
        comicInfoOnly,
      ),
    ).toEqual([["comicInfo"], ["comicInfo"], ["comicInfo"]])
  })
})

describe("resolveMetadataTargets", function testMetadataTargets() {
  const UNPARSEABLE = "<root><child></wrong></root>"

  it("writes every container the archive carries", async function targetCarried() {
    expect(
      resolveMetadataTargets(
        await inspect({
          "META-INF/container.xml": CONTAINER_XML,
          "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
        }),
      ),
    ).toEqual({ comicInfo: false, opf: true })

    expect(
      resolveMetadataTargets(
        await inspect({
          "META-INF/container.xml": CONTAINER_XML,
          "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
          "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
        }),
      ),
    ).toEqual({ comicInfo: true, opf: true })
  })

  it("creates a ComicInfo for an archive carrying no metadata", async function synthesizeComicInfo() {
    expect(
      resolveMetadataTargets(await inspect({ "page-001.jpg": "binary" })),
    ).toEqual({ comicInfo: true, opf: false })
  })

  it("writes nothing when a container it carries cannot be read", async function refuseUnreadable() {
    const brokenOpf = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": UNPARSEABLE,
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
    })
    const brokenComicInfo = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
      "ComicInfo.xml": UNPARSEABLE,
    })

    for (const inspection of [brokenOpf, brokenComicInfo]) {
      expect(resolveMetadataTargets(inspection)).toEqual({
        comicInfo: false,
        opf: false,
      })
      expect(hasWritableMetadataTarget(inspection)).toBe(false)
    }
  })
})
