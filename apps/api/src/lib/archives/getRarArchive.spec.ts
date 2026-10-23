import path from "node:path"
import { getArchiveFileRecordByUri } from "@prose-reader/archive-reader"
import { describe, expect, it } from "vitest"
import { getRarArchive } from "./getRarArchive.js"

const ONE_PAGE_RAR = path.join(import.meta.dirname, "fixtures", "one-page.rar")

describe("getRarArchive", () => {
  it("opens a RAR file small enough for Node's shared Buffer pool", async () => {
    const archive = await getRarArchive(ONE_PAGE_RAR)
    const page = await getArchiveFileRecordByUri(
      archive,
      "page-1.txt",
    )?.arrayBuffer()

    expect(archive.records.map((record) => record.uri)).toEqual(["page-1.txt"])
    expect(new TextDecoder().decode(page)).toBe("first page")
  })
})
