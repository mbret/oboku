// `zip.js` writes archives as node-native `Blob`s. Run under the `node`
// environment (not jsdom) so that `Blob`/`File` stay consistent: jsdom's `File`
// constructor does not recognise a node `Blob` and would silently drop its
// bytes when a caller wraps the output in a `File`.
// @vitest-environment node
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { BlobReader, ZipReader } from "@zip.js/zip.js"
import { describe, expect, it, vi } from "vitest"
import { updateArchive } from "../node"
import {
  type EditableArchive,
  readEntryText,
  toEditableArchive,
} from "./editableArchive"
import { openNoZipTarget } from "./staging"
import { writeZip } from "./writeZip"

const STORE = 0

type FirstEntry = {
  name: string
  compressionMethod: number
  extraFieldLength: number
}

const readFirstZipEntry = (buffer: ArrayBuffer): FirstEntry => {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  let offset = -1
  for (let index = 0; index < bytes.length - 3; index += 1) {
    if (
      bytes[index] === 0x50 &&
      bytes[index + 1] === 0x4b &&
      bytes[index + 2] === 0x03 &&
      bytes[index + 3] === 0x04
    ) {
      offset = index
      break
    }
  }

  if (offset === -1) throw new Error("No local file header found")

  const compressionMethod = view.getUint16(offset + 8, true)
  const nameLength = view.getUint16(offset + 26, true)
  const extraFieldLength = view.getUint16(offset + 28, true)
  const name = new TextDecoder().decode(
    bytes.subarray(offset + 30, offset + 30 + nameLength),
  )

  return { name, compressionMethod, extraFieldLength }
}

const openZip = (
  blob: Blob,
  options?: { name?: string; encodingFormat?: string },
) => createArchiveFromZipJs(new ZipReader(new BlobReader(blob)), options)

const readZip = async (blob: Blob): Promise<EditableArchive> =>
  toEditableArchive(await openZip(blob))

const buildNonCompliantEpub = async (): Promise<Blob> => {
  const entries: EditableArchive = new Map([
    ["META-INF/container.xml", { dir: false, content: "<container/>" }],
    ["OEBPS/content.opf", { dir: false, content: "<package/>" }],
    ["mimetype", { dir: false, content: "application/epub+zip" }],
  ])

  const { blob } = await writeZip(entries, { openZipTarget: openNoZipTarget })

  return blob
}

const buildGenericZip = async (): Promise<Blob> => {
  const entries: EditableArchive = new Map([
    ["images/cover.jpg", { dir: false, content: "image" }],
  ])

  return (await writeZip(entries, { openZipTarget: openNoZipTarget })).blob
}

describe("updateArchive", () => {
  it("writes the epub mimetype entry first and uncompressed", async () => {
    const input = await buildNonCompliantEpub()

    expect([...(await readZip(input)).keys()][0]).not.toBe("mimetype")

    const archive = await openZip(input)
    const { blob, mimeType } = await updateArchive(archive, { actions: [] })

    const outputFirst = readFirstZipEntry(
      await new Response(blob).arrayBuffer(),
    )
    expect(outputFirst.name).toBe("mimetype")
    expect(outputFirst.compressionMethod).toBe(STORE)
    expect(outputFirst.extraFieldLength).toBe(0)
    expect(mimeType).toBe("application/epub+zip")

    const reloaded = await readZip(blob)
    const mimetype = reloaded.get("mimetype")
    expect(mimetype && (await readEntryText(mimetype.content))).toBe(
      "application/epub+zip",
    )

    await archive.close()
  })

  it("uses EPUB content detection when the filename is unavailable", async () => {
    const archive = await openZip(await buildNonCompliantEpub())

    const { mimeType } = await updateArchive(archive, {
      actions: [],
      sourceMimeType: "application/zip",
    })

    expect(mimeType).toBe("application/epub+zip")

    await archive.close()
  })

  it("keeps a plain ZIP as application/zip when its MIME type is unavailable", async () => {
    const archive = await openZip(await buildGenericZip(), {
      name: "book.zip",
    })

    const { mimeType } = await updateArchive(archive, { actions: [] })

    expect(mimeType).toBe("application/zip")

    await archive.close()
  })

  it("uses the CBZ MIME type for a CBZ filename", async () => {
    const archive = await openZip(await buildGenericZip(), {
      name: "book.CBZ",
      encodingFormat: "application/zip",
    })

    const { mimeType } = await updateArchive(archive, { actions: [] })

    expect(mimeType).toBe("application/x-cbz")

    await archive.close()
  })

  it("uses the EPUB MIME type for an EPUB filename", async () => {
    const archive = await openZip(await buildNonCompliantEpub(), {
      name: "book.EPUB",
      encodingFormat: "application/zip",
    })

    const { mimeType } = await updateArchive(archive, { actions: [] })

    expect(mimeType).toBe("application/epub+zip")

    await archive.close()
  })

  it("defaults an unidentified ZIP archive to application/zip", async () => {
    const archive = await openZip(await buildGenericZip())

    const { mimeType } = await updateArchive(archive, { actions: [] })

    expect(mimeType).toBe("application/zip")

    await archive.close()
  })

  it("reports when it starts rebuilding the archive", async () => {
    const archive = await openZip(await buildNonCompliantEpub())
    const onProgress = vi.fn()

    await updateArchive(archive, { actions: [], onProgress })

    expect(onProgress).toHaveBeenCalledWith({ phase: "write-archive" })

    await archive.close()
  })
})
