// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
  type EditableArchive,
  readArchive,
  readEntryText,
  toArchive,
  writeArchive,
} from "./editableArchive"

const readFirstZipEntry = (
  buffer: ArrayBuffer,
): { name: string; compressionMethod: number; extraFieldLength: number } => {
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

  return {
    name: new TextDecoder().decode(
      bytes.subarray(
        offset + 30,
        offset + 30 + view.getUint16(offset + 26, true),
      ),
    ),
    compressionMethod: view.getUint16(offset + 8, true),
    extraFieldLength: view.getUint16(offset + 28, true),
  }
}

describe("editableArchive", () => {
  it("round-trips text and binary entries through a zip.js read/write cycle", async () => {
    const entries: EditableArchive = new Map([
      ["a/text.xhtml", { dir: false, content: "<p>hi</p>" }],
      ["a/bytes.bin", { dir: false, content: new Uint8Array([1, 2, 3]) }],
    ])

    const { entries: reloaded } = await readArchive(
      await writeArchive(entries, "application/zip"),
    )

    const text = reloaded.get("a/text.xhtml")
    const bin = reloaded.get("a/bytes.bin")

    expect(text && (await readEntryText(text.content))).toBe("<p>hi</p>")
    expect(bin && (await readEntryText(bin.content))).toBe(
      String.fromCharCode(1, 2, 3),
    )
  })

  it("exposes lazy records with byte sizes through the archive view", async () => {
    const entries: EditableArchive = new Map([
      ["note.txt", { dir: false, content: "abcde" }],
    ])

    const record = toArchive(entries).records[0]

    expect(record).toMatchObject({ dir: false, uri: "note.txt", size: 5 })
  })

  it("writes STORE entries uncompressed and without extra fields for EPUB OCF", async () => {
    const entries: EditableArchive = new Map([
      [
        "mimetype",
        { dir: false, content: "application/epub+zip", store: true },
      ],
      ["OEBPS/content.opf", { dir: false, content: "<package/>" }],
    ])

    const blob = await writeArchive(entries, "application/epub+zip")
    const first = readFirstZipEntry(await new Response(blob).arrayBuffer())

    expect(first.name).toBe("mimetype")
    expect(first.compressionMethod).toBe(0)
    expect(first.extraFieldLength).toBe(0)
  })
})
