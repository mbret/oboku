import path from "node:path"
import { describe, expect, it } from "vitest"
import { openArchive } from "./openArchive.js"

const ONE_PAGE_RAR = path.join(import.meta.dirname, "fixtures", "one-page.rar")
const ONE_PAGE_ZIP = path.join(import.meta.dirname, "fixtures", "one-page.zip")

describe("openArchive", () => {
  it("opens a file starting with the RAR signature as a RAR archive", async () => {
    const archive = await openArchive(ONE_PAGE_RAR)

    expect(archive.records.map((record) => record.uri)).toEqual(["page-1.txt"])
  })

  it("opens any other file as a zip archive", async () => {
    const archive = await openArchive(ONE_PAGE_ZIP)

    expect(archive.records.map((record) => record.uri)).toEqual(["page-1.txt"])
  })
})
