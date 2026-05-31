// @vitest-environment jsdom
import JSZip from "jszip"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CompressionResult } from "./imageCompressionPool"

const compress = vi.fn<(bytes: ArrayBuffer) => Promise<CompressionResult>>()
const terminate = vi.fn()

vi.mock("./imageCompressionPool", () => ({
  createImageCompressionPool: () => ({
    compress,
    terminate,
  }),
}))

const { compressArchiveImages } = await import("./compressArchiveImages")

const bytesOf = (value: string): Uint8Array =>
  Uint8Array.from(value, (character) => character.charCodeAt(0))

const arrayBufferOf = (value: string): ArrayBuffer => {
  const bytes = bytesOf(value)
  const buffer = new ArrayBuffer(bytes.byteLength)

  new Uint8Array(buffer).set(bytes)

  return buffer
}

const decode = (bytes: ArrayBuffer): string =>
  String.fromCharCode(...new Uint8Array(bytes))

const config = { maxWidth: undefined, maxHeight: undefined }

describe("compressArchiveImages", () => {
  beforeEach(() => {
    compress.mockReset()
    terminate.mockReset()
  })

  it("returns zero counts and never spins up a pool for an archive without images", async () => {
    const zip = new JSZip()
    zip.file("OEBPS/content.opf", "<package/>")

    const result = await compressArchiveImages(zip, config)

    expect(result).toEqual({
      totalImages: 0,
      compressedCount: 0,
      skippedCount: 0,
    })
    expect(compress).not.toHaveBeenCalled()
  })

  it("replaces images with their smaller webp output and skips the rest", async () => {
    compress.mockImplementation(async (bytes) =>
      decode(bytes).includes("CONVERT")
        ? { status: "ok", bytes: arrayBufferOf("x") }
        : { status: "skipped" },
    )

    const zip = new JSZip()
    zip.file("images/converted.jpg", bytesOf("CONVERT-larger-payload"))
    zip.file("images/skipped.png", bytesOf("KEEP"))

    const result = await compressArchiveImages(zip, config)

    expect(result).toEqual({
      totalImages: 2,
      compressedCount: 1,
      skippedCount: 1,
    })
    expect(zip.file("images/converted.jpg")).toBeNull()
    expect(zip.file("images/converted.webp")).not.toBeNull()
    expect(zip.file("images/skipped.png")).not.toBeNull()
    expect(terminate).toHaveBeenCalledOnce()
  })

  it("does not count a non-smaller webp output as compressed", async () => {
    compress.mockResolvedValue({ status: "ok", bytes: arrayBufferOf("larger") })

    const zip = new JSZip()
    zip.file("cover.jpg", bytesOf("tiny"))

    const result = await compressArchiveImages(zip, config)

    expect(result).toMatchObject({ compressedCount: 0, skippedCount: 1 })
    expect(zip.file("cover.jpg")).not.toBeNull()
    expect(zip.file("cover.webp")).toBeNull()
  })

  it("rewrites references only for the images it actually converted", async () => {
    compress.mockImplementation(async (bytes) =>
      decode(bytes).includes("CONVERT")
        ? { status: "ok", bytes: arrayBufferOf("x") }
        : { status: "skipped" },
    )

    const zip = new JSZip()
    zip.file("chapter1/page.jpg", bytesOf("CONVERT-larger-payload"))
    zip.file("chapter2/page.jpg", bytesOf("KEEP"))
    zip.file("chapter1/index.xhtml", `<img src="page.jpg"/>`)
    zip.file("chapter2/index.xhtml", `<img src="page.jpg"/>`)

    await compressArchiveImages(zip, config)

    expect(await zip.file("chapter1/index.xhtml")?.async("string")).toBe(
      `<img src="page.webp"/>`,
    )
    expect(await zip.file("chapter2/index.xhtml")?.async("string")).toBe(
      `<img src="page.jpg"/>`,
    )
  })

  it("skips images whose webp targets collide instead of overwriting each other", async () => {
    compress.mockResolvedValue({ status: "ok", bytes: arrayBufferOf("x") })

    const zip = new JSZip()
    zip.file("cover.jpg", bytesOf("jpg-larger-payload"))
    zip.file("cover.png", bytesOf("png-larger-payload"))

    const result = await compressArchiveImages(zip, config)

    expect(result).toEqual({
      totalImages: 2,
      compressedCount: 0,
      skippedCount: 2,
    })
    expect(zip.file("cover.jpg")).not.toBeNull()
    expect(zip.file("cover.png")).not.toBeNull()
    expect(zip.file("cover.webp")).toBeNull()
    expect(compress).not.toHaveBeenCalled()
  })

  it("skips an image whose webp target already exists in the archive", async () => {
    compress.mockResolvedValue({ status: "ok", bytes: arrayBufferOf("x") })

    const zip = new JSZip()
    zip.file("cover.png", bytesOf("png-larger-payload"))
    zip.file("cover.webp", bytesOf("existing-webp"))

    const result = await compressArchiveImages(zip, config)

    expect(decode(await zip.file("cover.webp")!.async("arraybuffer"))).toBe(
      "existing-webp",
    )
    expect(zip.file("cover.png")).not.toBeNull()
    expect(result).toMatchObject({ totalImages: 2, compressedCount: 0 })
  })

  it("reports progress for every processed image", async () => {
    compress.mockResolvedValue({ status: "skipped" })
    const onProgress = vi.fn()

    const zip = new JSZip()
    zip.file("a.jpg", bytesOf("a"))
    zip.file("b.jpg", bytesOf("b"))

    await compressArchiveImages(zip, config, { onProgress })

    expect(onProgress).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenLastCalledWith(2, 2)
  })
})
