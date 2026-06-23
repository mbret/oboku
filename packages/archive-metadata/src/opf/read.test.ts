import { arrayBufferFileAccessors, createArchive } from "@prose-reader/streamer"
import { describe, expect, it } from "vitest"
import type { Archive, ArchiveRecord } from "../archive/types"
import { findOpfEntry } from "./read"

const basename = (uri: string): string =>
  uri.split("/").filter(Boolean).pop() ?? uri

const toArrayBuffer = (body: string): ArrayBuffer => {
  const bytes = new TextEncoder().encode(body)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  return buffer
}

const makeArchive = (
  files: Record<string, string>,
  options: { directories?: string[] } = {},
): Archive => {
  const directoryRecords = (options.directories ?? []).map(
    (uri): ArchiveRecord => ({
      dir: true,
      basename: basename(uri),
      uri,
    }),
  )

  const fileRecords = Object.entries(files).map(
    ([uri, body]): ArchiveRecord => ({
      dir: false,
      basename: basename(uri),
      uri,
      size: body.length,
      ...arrayBufferFileAccessors(() => Promise.resolve(toArrayBuffer(body))),
    }),
  )

  return createArchive({
    filename: "test.zip",
    records: [...directoryRecords, ...fileRecords],
    close: () => Promise.resolve(),
  })
}

describe("OPF detection (findOpfEntry)", () => {
  it("finds an OPF at the canonical OEBPS/content.opf path", async () => {
    const archive = makeArchive({
      "META-INF/container.xml": "<container/>",
      "OEBPS/content.opf": "<package/>",
      "OEBPS/text/chapter1.xhtml": "<html/>",
    })

    const entry = findOpfEntry(archive)

    expect(entry?.uri).toBe("OEBPS/content.opf")
  })

  it("finds an OPF at the archive root", async () => {
    const archive = makeArchive({ "package.opf": "<package/>" })

    const entry = findOpfEntry(archive)

    expect(entry?.uri).toBe("package.opf")
  })

  it("matches the .opf extension case-insensitively", async () => {
    const archive = makeArchive({ "OEBPS/Content.OPF": "<package/>" })

    const entry = findOpfEntry(archive)

    expect(entry?.uri).toBe("OEBPS/Content.OPF")
  })

  it("returns undefined when the archive holds no .opf file", async () => {
    const archive = makeArchive({
      "META-INF/container.xml": "<container/>",
      "page-001.jpg": "binary",
    })

    const entry = findOpfEntry(archive)

    expect(entry).toBeUndefined()
  })

  it("returns the first .opf entry when several are present", async () => {
    const archive = makeArchive({
      "OEBPS/content.opf": "<package/>",
      "extras/legacy.opf": "<package/>",
    })

    const entry = findOpfEntry(archive)

    expect(entry?.uri).toBe("OEBPS/content.opf")
  })
})
