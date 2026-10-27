import { describe, expect, it, vi } from "vitest"
import { StreamerFileNotFoundError } from "../errors/errors.shared"

const mocks = vi.hoisted(function createBookFileMocks() {
  return {
    getBookFile: vi.fn<(bookId: string) => Promise<{ data: File } | null>>(),
  }
})

vi.mock("../download/getBookFile.shared", function mockBookFile() {
  return { getBookFile: mocks.getBookFile }
})

import { getBookKoreaderDocument } from "./getBookKoreaderDocument"

const md5OfHello = "5d41402abc4b2a76b9719d911017c592"

describe("getBookKoreaderDocument", () => {
  it("hashes a file shorter than KOReader's sample whole", async () => {
    mocks.getBookFile.mockResolvedValue({
      data: new File(["hello"], "book.epub"),
    })

    expect(await getBookKoreaderDocument("book-1")).toBe(md5OfHello)
    expect(mocks.getBookFile).toHaveBeenCalledWith("book-1")
  })

  it("fails as the reader's streamer does when the book is not downloaded", async () => {
    mocks.getBookFile.mockResolvedValue(null)

    await expect(getBookKoreaderDocument("book-1")).rejects.toBeInstanceOf(
      StreamerFileNotFoundError,
    )
  })
})
