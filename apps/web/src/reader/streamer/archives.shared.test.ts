import { describe, expect, it } from "vitest"
import { isRarFile } from "./archives.shared"

describe("isRarFile", () => {
  it("recognizes a RAR archive by a type that carries parameters", () => {
    const file = new File([], "book", {
      type: "application/x-rar-compressed; version=4",
    })

    expect(isRarFile({ data: file })).toBe(true)
  })
})
