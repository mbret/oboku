import { describe, expect, it } from "vitest"
import { getBookMetadataSource, getOrderedBookMetadataSources } from "./index"

describe("getBookMetadataSource", () => {
  it("files a legacy googleBookApi entry under the catalog", () => {
    expect(getBookMetadataSource({ type: "googleBookApi" })).toBe("catalog")
  })

  it("files every other entry under its own type", () => {
    expect(getBookMetadataSource({ type: "catalog" })).toBe("catalog")
    expect(getBookMetadataSource({ type: "file" })).toBe("file")
    expect(getBookMetadataSource({ type: "link" })).toBe("link")
    expect(getBookMetadataSource({ type: "user" })).toBe("user")
  })
})

describe("getOrderedBookMetadataSources", () => {
  it("puts the file above the catalog by default", () => {
    expect(getOrderedBookMetadataSources(undefined)).toEqual([
      "user",
      "file",
      "catalog",
      "link",
    ])
  })

  it("honors a reordered middle", () => {
    expect(getOrderedBookMetadataSources(["catalog", "file"])).toEqual([
      "user",
      "catalog",
      "file",
      "link",
    ])
  })

  it("reads the catalog's legacy name, as older versions of the app write it", () => {
    expect(getOrderedBookMetadataSources(["googleBookApi", "file"])).toEqual([
      "user",
      "catalog",
      "file",
      "link",
    ])
  })

  it("keeps the first of the legacy and current names when both are stored", () => {
    expect(getOrderedBookMetadataSources(["googleBookApi", "catalog"])).toEqual(
      ["user", "catalog", "file", "link"],
    )
  })
})
