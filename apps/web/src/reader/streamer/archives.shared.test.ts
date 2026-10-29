import { describe, expect, it } from "vitest"
import { isRarFile } from "./archives.shared"

describe("isRarFile", () => {
  it("recognizes a RAR archive by a type that carries parameters", () => {
    const file = new File([], "book", {
      type: "application/x-rar-compressed; version=4",
    })

    expect(isRarFile({ data: file })).toBe(true)
  })

  it("recognizes a CBR by Nextcloud's type", () => {
    const file = new File([], "book", { type: "application/comicbook+rar" })

    expect(isRarFile({ data: file })).toBe(true)
  })

  it("does not take a CBZ that Apache labels application/x-cbr for a RAR archive", () => {
    const file = new File([], "comic.cbz", { type: "application/x-cbr" })

    expect(isRarFile({ data: file })).toBe(false)
  })
})
