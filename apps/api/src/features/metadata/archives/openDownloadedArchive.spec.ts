import path from "node:path"
import { Logger } from "@nestjs/common"
import { afterEach, describe, expect, it, vi } from "vitest"
import { openDownloadedArchive } from "./openDownloadedArchive.js"

const ONE_PAGE_RAR = path.join(import.meta.dirname, "fixtures", "one-page.rar")
const ONE_PAGE_ZIP = path.join(import.meta.dirname, "fixtures", "one-page.zip")
const ONE_PAGE_TXT = path.join(import.meta.dirname, "fixtures", "one-page.txt")

describe("openDownloadedArchive", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("gives no archive and logs why when a file typed as an archive does not open", async () => {
    const log = vi.spyOn(Logger.prototype, "log")

    const archive = await openDownloadedArchive(ONE_PAGE_TXT, {
      name: "comic.cbz",
      contentType: "application/x-cbz",
    })

    expect(archive).toBeUndefined()
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Could not open the file as an archive"),
    )
  })

  it.each([
    ["zip", ONE_PAGE_ZIP, "comic.cbz", "application/x-cbz"],
    ["RAR", ONE_PAGE_RAR, "comic.cbr", "application/x-cbr"],
  ])(
    "opens a %s archive with the name and type given",
    async (_, filePath, name, contentType) => {
      const archive = await openDownloadedArchive(filePath, {
        name,
        contentType,
      })

      expect(archive).toMatchObject({
        filename: name,
        encodingFormat: contentType,
      })
    },
  )
})
