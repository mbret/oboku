import type { Manifest } from "@prose-reader/shared"
import { of } from "rxjs"
import { describe, expect, it } from "vitest"
import { createAppReader } from "./createAppReader"

const manifest: Manifest = {
  filename: "book.epub",
  mediaType: "application/epub+zip",
  title: "book",
  renditionLayout: "reflowable",
  renditionSpread: undefined,
  readingDirection: "ltr",
  spineItems: [],
  items: [],
}

describe("createAppReader", () => {
  it("creates the reader in the theme it is given, through every enhancer", () => {
    const reader = createAppReader({
      manifest,
      theme: "night",
      pdf: {
        pdfjsViewerInlineCss: "",
        getArchiveForItem: function getNoPdfArchive() {
          return of(undefined)
        },
      },
    })
    const themeAtCreation = reader.theme.get()

    reader.destroy()

    expect(themeAtCreation).toBe("night")
  })
})
