// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { CONTAINER_XML, comicInfo, inspect, opf } from "./inspection.fixture"
import { hasWritableMetadataTarget, resolveMetadataTargets } from "./targets"

describe("resolveMetadataTargets", () => {
  it("writes only the OPF of an EPUB that carries no ComicInfo", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: true,
    })
  })

  it("writes both when the EPUB already carries a ComicInfo", async () => {
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

  it("synthesizes a ComicInfo for an archive with no OPF", async () => {
    const inspection = await inspect({ "page-001.jpg": "binary" })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: false,
    })
  })

  it("writes nowhere when the only container it carries cannot be parsed", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": "<package><metadata></wrong></package>",
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
    expect(hasWritableMetadataTarget(inspection)).toBe(false)
  })

  it("still writes the ComicInfo of a book whose OPF cannot be parsed", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": "<package><metadata></wrong></package>",
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: false,
    })
    expect(hasWritableMetadataTarget(inspection)).toBe(true)
  })

  it("keeps writing an unreadable ComicInfo it would replace", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
      "ComicInfo.xml": "<ComicInfo></wrong></ComicInfo>",
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: true,
    })
  })
})
