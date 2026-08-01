// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { type EditableArchive, readEntryText } from "../update/editableArchive"
import type { CompressionResult } from "./compressionPool"

const compress = vi.fn<(bytes: ArrayBuffer) => Promise<CompressionResult>>()
const terminate = vi.fn()
const createImageCompressionPool = vi.fn(() => ({
  compress,
  terminate,
}))

vi.mock("./compressionPool", () => ({
  createImageCompressionPool,
}))

const { compressArchiveImages } = await import("./compress")

const bytesOf = (value: string): Uint8Array =>
  Uint8Array.from(value, (character) => character.charCodeAt(0))

const arrayBufferOf = (value: string): ArrayBuffer => {
  const bytes = bytesOf(value)
  const buffer = new ArrayBuffer(bytes.byteLength)

  new Uint8Array(buffer).set(bytes)

  return buffer
}

const archiveOf = (
  files: Record<string, string | Uint8Array>,
): EditableArchive =>
  new Map(
    Object.entries(files).map(([path, content]) => [
      path,
      { dir: false, content },
    ]),
  )

const textOf = (entries: EditableArchive, path: string): Promise<string> => {
  const entry = entries.get(path)

  if (!entry) throw new Error(`missing entry: ${path}`)

  return readEntryText(entry.content)
}

const config = { maxWidth: undefined, maxHeight: undefined }

const stageBytes = async (bytes: ArrayBuffer): Promise<Blob> =>
  new Blob([bytes])

describe("compressArchiveImages", () => {
  beforeEach(() => {
    compress.mockReset()
    terminate.mockReset()
    createImageCompressionPool.mockClear()
  })

  it("returns zero counts and never spins up a pool for an archive without images", async () => {
    const entries = archiveOf({ "OEBPS/content.opf": "<package/>" })

    const result = await compressArchiveImages(entries, config, { stageBytes })

    expect(result).toEqual({
      totalImages: 0,
      compressedCount: 0,
      skippedCount: 0,
    })
    expect(compress).not.toHaveBeenCalled()
  })

  it("replaces images with their smaller webp output and skips the rest", async () => {
    compress.mockImplementation(async (bytes) =>
      new TextDecoder().decode(bytes).includes("CONVERT")
        ? { status: "ok", bytes: arrayBufferOf("x") }
        : { status: "skipped" },
    )

    const entries = archiveOf({
      "images/converted.jpg": bytesOf("CONVERT-larger-payload"),
      "images/skipped.png": bytesOf("KEEP"),
    })

    const result = await compressArchiveImages(entries, config, { stageBytes })

    expect(result).toEqual({
      totalImages: 2,
      compressedCount: 1,
      skippedCount: 1,
    })
    expect(entries.has("images/converted.jpg")).toBe(false)
    expect(entries.has("images/converted.webp")).toBe(true)
    expect(entries.has("images/skipped.png")).toBe(true)
    expect(terminate).toHaveBeenCalledOnce()
  })

  it("does not count a non-smaller webp output as compressed", async () => {
    compress.mockResolvedValue({ status: "ok", bytes: arrayBufferOf("larger") })

    const entries = archiveOf({ "cover.jpg": bytesOf("tiny") })

    const result = await compressArchiveImages(entries, config, { stageBytes })

    expect(result).toMatchObject({ compressedCount: 0, skippedCount: 1 })
    expect(entries.has("cover.jpg")).toBe(true)
    expect(entries.has("cover.webp")).toBe(false)
  })

  it("rewrites references only for the images it actually converted", async () => {
    compress.mockImplementation(async (bytes) =>
      new TextDecoder().decode(bytes).includes("CONVERT")
        ? { status: "ok", bytes: arrayBufferOf("x") }
        : { status: "skipped" },
    )

    const entries = archiveOf({
      "chapter1/page.jpg": bytesOf("CONVERT-larger-payload"),
      "chapter2/page.jpg": bytesOf("KEEP"),
      "chapter1/index.xhtml": `<img src="page.jpg"/>`,
      "chapter2/index.xhtml": `<img src="page.jpg"/>`,
    })

    await compressArchiveImages(entries, config, { stageBytes })

    expect(await textOf(entries, "chapter1/index.xhtml")).toBe(
      `<img src="page.webp"/>`,
    )
    expect(await textOf(entries, "chapter2/index.xhtml")).toBe(
      `<img src="page.jpg"/>`,
    )
  })

  it("skips images whose webp targets collide instead of overwriting each other", async () => {
    compress.mockResolvedValue({ status: "ok", bytes: arrayBufferOf("x") })

    const entries = archiveOf({
      "cover.jpg": bytesOf("jpg-larger-payload"),
      "cover.png": bytesOf("png-larger-payload"),
    })

    const result = await compressArchiveImages(entries, config, { stageBytes })

    expect(result).toEqual({
      totalImages: 2,
      compressedCount: 0,
      skippedCount: 2,
    })
    expect(entries.has("cover.jpg")).toBe(true)
    expect(entries.has("cover.png")).toBe(true)
    expect(entries.has("cover.webp")).toBe(false)
    expect(compress).not.toHaveBeenCalled()
  })

  it("skips an image whose webp target already exists in the archive", async () => {
    compress.mockResolvedValue({ status: "ok", bytes: arrayBufferOf("x") })

    const entries = archiveOf({
      "cover.png": bytesOf("png-larger-payload"),
      "cover.webp": bytesOf("existing-webp"),
    })

    const result = await compressArchiveImages(entries, config, { stageBytes })

    expect(await textOf(entries, "cover.webp")).toBe("existing-webp")
    expect(entries.has("cover.png")).toBe(true)
    expect(result).toMatchObject({ totalImages: 1, compressedCount: 0 })
  })

  it("never converts gif entries, to avoid flattening animations", async () => {
    compress.mockResolvedValue({ status: "ok", bytes: arrayBufferOf("x") })

    const entries = archiveOf({
      "images/animation.gif": bytesOf("GIF-larger-payload"),
      "images/photo.jpg": bytesOf("CONVERT-larger-payload"),
    })

    const result = await compressArchiveImages(entries, config, { stageBytes })

    expect(result.totalImages).toBe(1)
    expect(entries.has("images/animation.gif")).toBe(true)
    expect(entries.has("images/animation.webp")).toBe(false)
    expect(entries.has("images/photo.webp")).toBe(true)
    expect(compress).toHaveBeenCalledOnce()
  })

  it("reports progress for every processed image", async () => {
    compress.mockResolvedValue({ status: "skipped" })
    const onProgress = vi.fn()

    const entries = archiveOf({
      "a.jpg": bytesOf("a"),
      "b.jpg": bytesOf("b"),
    })

    await compressArchiveImages(entries, config, { stageBytes, onProgress })

    expect(onProgress).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenLastCalledWith(2, 2)
  })

  it("compresses at most two images concurrently", async () => {
    let active = 0
    let peak = 0
    let releaseFirstBatch = function releaseImmediately() {}
    const firstBatch = new Promise<void>(function waitForRelease(resolve) {
      releaseFirstBatch = resolve
    })

    compress.mockImplementation(async function holdFirstBatch() {
      active += 1
      peak = Math.max(peak, active)

      if (compress.mock.calls.length <= 2) await firstBatch

      active -= 1

      return { status: "skipped" }
    })

    const entries = archiveOf({
      "a.jpg": bytesOf("a"),
      "b.jpg": bytesOf("b"),
      "c.jpg": bytesOf("c"),
      "d.jpg": bytesOf("d"),
    })

    const compression = compressArchiveImages(entries, config, { stageBytes })

    await vi.waitFor(function waitForFirstBatch() {
      expect(compress).toHaveBeenCalledTimes(2)
    })

    expect(createImageCompressionPool).toHaveBeenCalledWith(2)
    expect(peak).toBe(2)

    releaseFirstBatch()
    await compression

    expect(compress).toHaveBeenCalledTimes(4)
    expect(peak).toBe(2)
  })
})
