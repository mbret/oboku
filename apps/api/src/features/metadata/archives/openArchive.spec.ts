import path from "node:path"
import { describe, expect, it } from "vitest"
import { openArchive } from "./openArchive.js"

const ONE_PAGE_RAR = path.join(import.meta.dirname, "fixtures", "one-page.rar")
const ONE_PAGE_ZIP = path.join(import.meta.dirname, "fixtures", "one-page.zip")
const ONE_PAGE_TXT = path.join(import.meta.dirname, "fixtures", "one-page.txt")

describe("openArchive", () => {
  it("opens a file starting with the RAR signature as a RAR archive", async () => {
    const archive = await openArchive(ONE_PAGE_RAR)

    expect(archive.records.map((record) => record.uri)).toEqual(["page-1.txt"])
  })

  it("opens any other file as a zip archive", async () => {
    const archive = await openArchive(ONE_PAGE_ZIP)

    expect(archive.records.map((record) => record.uri)).toEqual(["page-1.txt"])
  })

  it("rejects a file that is neither a RAR nor a zip archive", async () => {
    await expect(openArchive(ONE_PAGE_TXT)).rejects.toThrow()
  })

  it("gives the archive the name and type of the file it came from", async () => {
    const rarArchive = await openArchive(ONE_PAGE_RAR, {
      name: "comic.cbr",
      encodingFormat: "application/x-cbr",
    })
    const zipArchive = await openArchive(ONE_PAGE_ZIP, {
      name: "comic.cbz",
      encodingFormat: "application/x-cbz",
    })

    expect(rarArchive).toMatchObject({
      filename: "comic.cbr",
      encodingFormat: "application/x-cbr",
    })
    expect(zipArchive).toMatchObject({
      filename: "comic.cbz",
      encodingFormat: "application/x-cbz",
    })
  })
})
