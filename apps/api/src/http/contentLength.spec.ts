import { toDecodedContentLength } from "./contentLength.js"

describe("toDecodedContentLength", () => {
  it("reads the length of an uncompressed body", () => {
    expect(
      toDecodedContentLength(new Headers({ "content-length": "1048576" })),
    ).toBe(1048576)
  })

  it.each([
    ["a missing length", {}],
    [
      "a compressed body",
      { "content-length": "2048", "content-encoding": "gzip" },
    ],
    ["a length that is no byte count", { "content-length": "about 2 MB" }],
  ])("states none for %s", (_, headers) => {
    expect(toDecodedContentLength(new Headers(headers))).toBeUndefined()
  })
})
