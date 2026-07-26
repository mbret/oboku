import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { BlobReader, ZipReader } from "@zip.js/zip.js"
import { describe, expect, it, vi } from "vitest"
import {
  type EditableArchive,
  readEntryText,
  toEditableArchive,
} from "./editableArchive"
import { openNoZipTarget } from "./staging"
import { writeZip } from "./writeZip"

const readZip = async (blob: Blob): Promise<EditableArchive> =>
  toEditableArchive(
    await createArchiveFromZipJs(new ZipReader(new BlobReader(blob))),
  )

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

describe("writeZip", () => {
  it("round-trips text and binary entries through a zip.js read/write cycle", async () => {
    const entries: EditableArchive = new Map([
      ["a/text.xhtml", { dir: false, content: "<p>hi</p>" }],
      ["a/bytes.bin", { dir: false, content: new Uint8Array([1, 2, 3]) }],
    ])

    const { blob } = await writeZip(entries, {
      openZipTarget: openNoZipTarget,
    })
    const reloaded = await readZip(blob)

    const text = reloaded.get("a/text.xhtml")
    const bin = reloaded.get("a/bytes.bin")

    expect(text && (await readEntryText(text.content))).toBe("<p>hi</p>")
    expect(bin && (await readEntryText(bin.content))).toBe(
      String.fromCharCode(1, 2, 3),
    )
  })

  it("writes STORE entries uncompressed and without extra fields for EPUB OCF", async () => {
    const entries: EditableArchive = new Map([
      [
        "mimetype",
        { dir: false, content: "application/epub+zip", store: true },
      ],
      ["OEBPS/content.opf", { dir: false, content: "<package/>" }],
    ])

    const { blob } = await writeZip(entries, {
      openZipTarget: openNoZipTarget,
    })
    const first = readFirstZipEntry(await new Response(blob).arrayBuffer())

    expect(first.name).toBe("mimetype")
    expect(first.compressionMethod).toBe(0)
    expect(first.extraFieldLength).toBe(0)
  })

  it("streams into the target when the runtime offers one", async () => {
    const chunks: BlobPart[] = []
    const entries: EditableArchive = new Map([
      ["note.txt", { dir: false, content: "hello" }],
    ])

    const { blob } = await writeZip(entries, {
      openZipTarget: async () => ({
        stream: new WritableStream<Uint8Array>({
          write(chunk) {
            chunks.push(new Uint8Array(chunk))
          },
        }),
        finish: async () => new Blob(chunks),
        dispose: () => Promise.resolve(),
      }),
    })

    expect(chunks.length).toBeGreaterThan(0)
    expect((await readZip(blob)).has("note.txt")).toBe(true)
  })

  it("propagates a target that cannot be opened", async () => {
    const entries: EditableArchive = new Map([
      ["note.txt", { dir: false, content: "hello" }],
    ])

    await expect(
      writeZip(entries, {
        openZipTarget: () => Promise.reject(new Error("quota exceeded")),
      }),
    ).rejects.toThrow("quota exceeded")
  })

  it("disposes the target and propagates when the stream fails mid-write", async () => {
    const entries: EditableArchive = new Map([
      ["note.txt", { dir: false, content: "hello" }],
    ])
    const dispose = vi.fn(() => Promise.resolve())

    await expect(
      writeZip(entries, {
        openZipTarget: async () => ({
          stream: new WritableStream<Uint8Array>({
            write() {
              throw new Error("device full")
            },
          }),
          finish: async () => new Blob([]),
          dispose,
        }),
      }),
    ).rejects.toThrow("device full")
    expect(dispose).toHaveBeenCalled()
  })
})
