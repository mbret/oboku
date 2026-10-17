import { toSyncKey } from "./protocol.js"

describe("toSyncKey", () => {
  it("derives the key the way KOReader does: the MD5 hex of the password", () => {
    expect(toSyncKey("password")).toBe("5f4dcc3b5aa765d61d8327deb882cf99")
  })
})
