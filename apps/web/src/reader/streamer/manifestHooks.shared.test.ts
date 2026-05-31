import type { Archive, Manifest } from "@prose-reader/streamer"
import { describe, expect, it } from "vitest"
import {
  readingDirectionManifestHook,
  webtoonManifestHook,
} from "./manifestHooks.shared"

const createArchive = (filename: string): Archive => ({
  filename,
  records: [],
  recordsByUri: new Map(),
  close: async () => undefined,
})

const createManifest = ({
  filename = "book.cbz",
  readingDirection = "ltr",
}: {
  filename?: string
  readingDirection?: Manifest["readingDirection"]
} = {}): Manifest => ({
  filename,
  title: "Book",
  renditionLayout: undefined,
  renditionSpread: undefined,
  readingDirection,
  spineItems: [
    {
      id: "page-1",
      href: "page-1.jpg",
      index: 0,
      renditionLayout: "pre-paginated",
    },
  ],
  items: [],
})

describe("readingDirectionManifestHook", () => {
  it("applies an explicit direction directive over the current manifest value", async () => {
    const manifest = await readingDirectionManifestHook({
      archive: createArchive("Book [oboku~direction~ltr].cbz"),
      baseUrl: "",
    })(createManifest({ readingDirection: "rtl" }))

    expect(manifest.readingDirection).toBe("ltr")
  })

  it("returns the manifest unchanged when no direction directive is present", async () => {
    const input = createManifest({
      filename: "Book.cbz",
      readingDirection: undefined,
    })
    const manifest = await readingDirectionManifestHook({
      archive: createArchive("Book.cbz"),
      baseUrl: "",
    })(input)

    expect(manifest).toBe(input)
  })

  it("preserves existing direction for non-CBZ archives without directives", async () => {
    const manifest = await readingDirectionManifestHook({
      archive: createArchive("Book.epub"),
      baseUrl: "",
    })(createManifest({ filename: "Book.epub", readingDirection: "rtl" }))

    expect(manifest.readingDirection).toBe("rtl")
  })

  it("returns the manifest unchanged when the directive matches the current value", async () => {
    const input = createManifest({ readingDirection: "ltr" })
    const manifest = await readingDirectionManifestHook({
      archive: createArchive("Book [oboku~direction~ltr].cbz"),
      baseUrl: "",
    })(input)

    expect(manifest).toBe(input)
  })
})

describe("webtoonManifestHook", () => {
  it("keeps webtoon presentation changes in the manifest hook pipeline", async () => {
    const manifest = await webtoonManifestHook({
      archive: createArchive("Book [oboku~webtoon].cbz"),
      baseUrl: "",
    })(createManifest())

    expect(manifest.renditionLayout).toBe("reflowable")
    expect(manifest.renditionFlow).toBe("scrolled-continuous")
    expect(manifest.spineItems).toEqual([
      expect.objectContaining({ renditionLayout: "reflowable" }),
    ])
  })
})
