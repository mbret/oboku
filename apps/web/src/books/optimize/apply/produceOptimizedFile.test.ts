// @vitest-environment jsdom
import JSZip from "jszip"
import { describe, expect, it } from "vitest"
import { produceOptimizedFile } from "./produceOptimizedFile"

const STORE = 0

type FirstEntry = {
  name: string
  compressionMethod: number
  extraFieldLength: number
}

const readArrayBuffer = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error("Expected an ArrayBuffer result"))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })

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
  const zip = new JSZip()

  zip.file("META-INF/container.xml", "<container/>", { compression: "DEFLATE" })
  zip.file("OEBPS/content.opf", "<package/>", { compression: "DEFLATE" })
  zip.file("mimetype", "application/epub+zip", { compression: "DEFLATE" })

  const blob = await zip.generateAsync({ type: "blob" })

  return new File([blob], "book.epub", { type: "application/epub+zip" })
}

describe("produceOptimizedFile", () => {
  it("writes the epub mimetype entry first and uncompressed", async () => {
    const input = await buildNonCompliantEpub()

    const inputZip = await JSZip.loadAsync(input)
    expect(Object.keys(inputZip.files)[0]).not.toBe("mimetype")

    const output = await produceOptimizedFile(input, [])
    const outputBytes = await readArrayBuffer(output)

    const outputFirst = readFirstZipEntry(outputBytes)
    expect(outputFirst.name).toBe("mimetype")
    expect(outputFirst.compressionMethod).toBe(STORE)
    expect(outputFirst.extraFieldLength).toBe(0)

    const reloaded = await JSZip.loadAsync(outputBytes)
    expect(await reloaded.file("mimetype")?.async("string")).toBe(
      "application/epub+zip",
    )
  })
})
