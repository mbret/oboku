import { describe, expect, it } from "vitest"
import {
  getBookMetadataProvider,
  getOrderedBookMetadataProviders,
} from "./index"

describe("getBookMetadataProvider", () => {
  it("files a legacy googleBookApi entry under the catalog", () => {
    expect(getBookMetadataProvider({ type: "googleBookApi" })).toBe("catalog")
  })

  it("files every other entry under its own type", () => {
    expect(getBookMetadataProvider({ type: "catalog" })).toBe("catalog")
    expect(getBookMetadataProvider({ type: "file" })).toBe("file")
    expect(getBookMetadataProvider({ type: "link" })).toBe("link")
    expect(getBookMetadataProvider({ type: "user" })).toBe("user")
  })
})

describe("getOrderedBookMetadataProviders", () => {
  it("puts the file above the catalog by default", () => {
    expect(getOrderedBookMetadataProviders(undefined)).toEqual([
      "user",
      "file",
      "catalog",
      "link",
    ])
  })

  it("honors a reordered middle", () => {
    expect(getOrderedBookMetadataProviders(["catalog", "file"])).toEqual([
      "user",
      "catalog",
      "file",
      "link",
    ])
  })

  it("reads the catalog's legacy name, as older versions of the app write it", () => {
    expect(getOrderedBookMetadataProviders(["googleBookApi", "file"])).toEqual([
      "user",
      "catalog",
      "file",
      "link",
    ])
  })

  it("keeps the first of the legacy and current names when both are stored", () => {
    expect(
      getOrderedBookMetadataProviders(["googleBookApi", "catalog"]),
    ).toEqual(["user", "catalog", "file", "link"])
  })
})
