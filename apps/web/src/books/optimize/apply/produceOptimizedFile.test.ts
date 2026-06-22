// `zip.js` writes archives as node-native `Blob`s. Run under the `node`
// environment (not jsdom) so that `Blob`/`File` stay consistent: jsdom's `File`
// constructor does not recognise a node `Blob` and would silently drop its
// bytes when `produceOptimizedFile` wraps the output in a `File`.
// @vitest-environment node
import { describe, expect, it } from "vitest"
import {
  type EditableArchive,
  readArchive,
  readEntryText,
} from "../archives/editableArchive"
import { writeArchive } from "../archives/writeArchive"
import { produceOptimizedFile } from "./produceOptimizedFile"

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

const buildNonCompliantEpub = async (): Promise<File> => {
  const entries: EditableArchive = new Map([
    ["META-INF/container.xml", { dir: false, content: "<container/>" }],
    ["OEBPS/content.opf", { dir: false, content: "<package/>" }],
    ["mimetype", { dir: false, content: "application/epub+zip" }],
  ])

  const { blob } = await writeArchive(entries)

  return new File([blob], "book.epub", { type: "application/epub+zip" })
}

describe("produceOptimizedFile", () => {
  it("writes the epub mimetype entry first and uncompressed", async () => {
    const input = await buildNonCompliantEpub()

    const { entries: inputEntries } = await readArchive(input)
    expect([...inputEntries.keys()][0]).not.toBe("mimetype")

    const { file: output, close } = await produceOptimizedFile(input, [])
    const outputBytes = await output.arrayBuffer()

    const outputFirst = readFirstZipEntry(outputBytes)
    expect(outputFirst.name).toBe("mimetype")
    expect(outputFirst.compressionMethod).toBe(STORE)
    expect(outputFirst.extraFieldLength).toBe(0)

    const { entries: reloaded } = await readArchive(output)
    const mimetype = reloaded.get("mimetype")
    expect(mimetype && (await readEntryText(mimetype.content))).toBe(
      "application/epub+zip",
    )

    await close()
  })
})
