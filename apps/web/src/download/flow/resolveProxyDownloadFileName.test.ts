import { describe, expect, it } from "vitest"
import { resolveProxyDownloadFileName } from "./resolveProxyDownloadFileName"

describe("resolveProxyDownloadFileName", () => {
  it("uses the last segment of a provider file path", () => {
    expect(
      resolveProxyDownloadFileName({
        _id: "link-1",
        data: { filePath: "/books/scifi/Dune.epub" },
      }),
    ).toBe("Dune.epub")
  })

  it("uses the last path segment of a url, ignoring query and trailing slash", () => {
    expect(
      resolveProxyDownloadFileName({
        _id: "link-2",
        data: { url: "https://example.org/dl/Dune.epub?token=abc" },
      }),
    ).toBe("Dune.epub")
  })

  it("falls back to the link id when nothing usable is on the link", () => {
    expect(resolveProxyDownloadFileName({ _id: "link-3", data: {} })).toBe(
      "link-3",
    )
  })

  it("falls back to the raw value when a url cannot be parsed", () => {
    expect(
      resolveProxyDownloadFileName({
        _id: "link-4",
        data: { url: "not a url" },
      }),
    ).toBe("not a url")
  })
})
