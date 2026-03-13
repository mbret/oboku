import { describe, expect, it } from "vitest"
import { restoreCachedBookFile } from "./getBookFile.shared"

describe("restoreCachedBookFile", () => {
  it("preserves the stored filename when rebuilding a cached blob", () => {
    const restoredFile = restoreCachedBookFile({
      file: new Blob(["hello"], { type: "text/plain" }),
      filename: "chapter.txt",
    })

    expect(restoredFile).toBeInstanceOf(File)
    expect(restoredFile.name).toBe("chapter.txt")
    expect(restoredFile.type).toBe("text/plain")
  })
})
