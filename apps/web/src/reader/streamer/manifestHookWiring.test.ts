// @vitest-environment jsdom
import {
  arrayBufferFileAccessors,
  createArchive,
} from "@prose-reader/archive-reader"
import { streamerHooks as cbzStreamerHooks } from "@prose-reader/cbz"
import { generateManifestFromArchive } from "@prose-reader/streamer"
import { describe, expect, it } from "vitest"
import {
  readingDirectionManifestHook,
  webtoonManifestHook,
} from "./manifestHooks.shared"

// Mirrors the flat manifest hook array wired into webStreamer and
// swStreamer, exercised through the real streamer pipeline. Guards the hook
// ordering: an oboku direction directive must win over the cbz rtl default,
// and the webtoon directive must apply last.
const obokuManifestHooks = [
  readingDirectionManifestHook,
  ...cbzStreamerHooks.manifest,
  webtoonManifestHook,
]

const makeCbzArchive = (filename: string) =>
  createArchive({
    filename,
    records: ["01.jpg", "02.jpg"].map((uri) => ({
      dir: false,
      basename: uri,
      uri,
      size: 3,
      ...arrayBufferFileAccessors(() =>
        Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
      ),
    })),
    close: () => Promise.resolve(),
  })

const generate = (filename: string) =>
  generateManifestFromArchive(makeCbzArchive(filename), {
    baseUrl: "http://x/streamer/book/",
    hooks: obokuManifestHooks,
  })

describe("streamer manifest hook wiring (regression)", () => {
  it("defaults a plain CBZ to rtl (cbz detect hook)", async () => {
    const manifest = await generate("book.cbz")

    expect(manifest.readingDirection).toBe("rtl")
  })

  it("lets an oboku direction directive override the cbz rtl default", async () => {
    const manifest = await generate("book [oboku~direction~ltr].cbz")

    expect(manifest.readingDirection).toBe("ltr")
  })

  it("applies the webtoon directive as scrolled-continuous reflowable", async () => {
    const manifest = await generate("book [oboku~webtoon].cbz")

    expect(manifest.renditionLayout).toBe("reflowable")
    expect(manifest.renditionFlow).toBe("scrolled-continuous")
  })
})
