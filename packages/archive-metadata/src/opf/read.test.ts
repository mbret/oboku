import { describe, expect, it } from "vitest"
import type { ArchiveEntry, ArchiveSource } from "../archive/types"
import { findOpfEntry } from "./read"

const makeArchive = (
  files: Record<string, string>,
  options: { directories?: string[] } = {},
): ArchiveSource => {
  const directoryEntries: ArchiveEntry[] = (options.directories ?? []).map(
    (path) => ({
      path,
      isDir: true,
      readAsString: () => Promise.reject(new Error("dir entry")),
      readAsUint8Array: () => Promise.reject(new Error("dir entry")),
    }),
  )

  const fileEntries: ArchiveEntry[] = Object.entries(files).map(
    ([path, body]) => ({
      path,
      isDir: false,
      readAsString: () => Promise.resolve(body),
      readAsUint8Array: () => Promise.resolve(new TextEncoder().encode(body)),
    }),
  )

  return {
    listEntries: () => Promise.resolve([...directoryEntries, ...fileEntries]),
  }
}

describe("OPF detection (findOpfEntry)", () => {
  it("finds an OPF at the canonical OEBPS/content.opf path", async () => {
    const archive = makeArchive({
      "META-INF/container.xml": "<container/>",
      "OEBPS/content.opf": "<package/>",
      "OEBPS/text/chapter1.xhtml": "<html/>",
    })

    const entry = await findOpfEntry(archive)

    expect(entry?.path).toBe("OEBPS/content.opf")
  })

  it("finds an OPF at the archive root", async () => {
    const archive = makeArchive({ "package.opf": "<package/>" })

    const entry = await findOpfEntry(archive)

    expect(entry?.path).toBe("package.opf")
  })

  it("matches the .opf extension case-insensitively", async () => {
    const archive = makeArchive({ "OEBPS/Content.OPF": "<package/>" })

    const entry = await findOpfEntry(archive)

    expect(entry?.path).toBe("OEBPS/Content.OPF")
  })

  it("returns undefined when the archive holds no .opf file", async () => {
    const archive = makeArchive({
      "META-INF/container.xml": "<container/>",
      "page-001.jpg": "binary",
    })

    const entry = await findOpfEntry(archive)

    expect(entry).toBeUndefined()
  })

  it("returns the first .opf entry when several are present", async () => {
    const archive = makeArchive({
      "OEBPS/content.opf": "<package/>",
      "extras/legacy.opf": "<package/>",
    })

    const entry = await findOpfEntry(archive)

    expect(entry?.path).toBe("OEBPS/content.opf")
  })
})
