// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { CONTAINER_XML, comicInfo, inspect, opf } from "./inspection.fixture"
import { hasWritableMetadataTarget, resolveMetadataTargets } from "./containers"

const UNPARSEABLE = "<root><child></wrong></root>"

describe("resolveMetadataTargets", () => {
  it("writes only the OPF of an EPUB carrying nothing else", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: true,
    })
  })

  it("writes both when the EPUB also carries a ComicInfo", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: true,
    })
  })

  it("writes the ComicInfo an archive with no OPF carries", async () => {
    const inspection = await inspect({
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
      "page-001.jpg": "binary",
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: false,
    })
  })

  it("creates a ComicInfo for an archive carrying no metadata at all", async () => {
    const inspection = await inspect({ "page-001.jpg": "binary" })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: false,
    })
  })

  it("writes nothing when the OPF cannot be read", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": UNPARSEABLE,
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
    expect(hasWritableMetadataTarget(inspection)).toBe(false)
  })

  it("writes nothing when the OPF cannot be read even alongside a ComicInfo", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": UNPARSEABLE,
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
  })

  it("writes nothing when the ComicInfo cannot be read", async () => {
    const inspection = await inspect({
      "ComicInfo.xml": UNPARSEABLE,
      "page-001.jpg": "binary",
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
    expect(hasWritableMetadataTarget(inspection)).toBe(false)
  })

  it("writes nothing when the ComicInfo cannot be read even alongside a readable OPF", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
      "ComicInfo.xml": UNPARSEABLE,
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
  })
})
